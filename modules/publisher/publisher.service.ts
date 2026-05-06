import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import path from "path";
import { generateBilingualContent } from "../ai/ai.service";
import { fetchLatestNews } from "../news/news-sources.service";
import { generateArticleImageAndAnalyzeQA } from "../images/image.service";
import { generateSlug, formatTitle } from "../../lib/utils";
import { sendCriticalErrorNotification } from "../notifications/telegram.service";

/**
 * PublisherService: Orquestador central del pipeline de publicación.
 */
export class PublisherService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Ejecuta el proceso completo de publicación diaria.
   */
  async publishDailyArticle(sourceSlugs?: string[]) {
    console.log("=====================================================");
    console.log("🚀 INICIANDO PIPELINE DE PUBLICACIÓN AUTOMÁTICA 🚀");
    if (sourceSlugs) console.log(`🎯 Filtrando por fuentes: ${sourceSlugs.join(', ')}`);
    console.log("=====================================================\n");

    try {
      // 1. Asegurar categorías base
      console.log("📁 [1/7] Asegurando categorías base...");
      await this.ensureCategories();
      const allCategories = await this.prisma.category.findMany();

      // 2. Obtener contexto de artículos recientes para evitar duplicados
      console.log("🔍 [2/7] Obteniendo contexto de artículos recientes...");
      const { recentTitles, recentSourceUrls } = await this.getRecentContext();
      
      // 3. Obtener noticias de fuentes RSS
      console.log("📡 [3/7] Buscando noticias en fuentes RSS...");
      const newsContext = await fetchLatestNews(recentTitles, recentSourceUrls, 10, sourceSlugs);
      
      if (newsContext.newsItems.length === 0) {
        const errorMsg = '❌ ERROR CRÍTICO: No se encontraron noticias en las fuentes configuradas. Se requieren fuentes reales para generar contenido. La publicación ha sido cancelada.';
        console.error(errorMsg);
        await sendCriticalErrorNotification(errorMsg);
        throw new Error(errorMsg);
      }
      console.log(`🗞️ Detectadas ${newsContext.newsItems.length} noticias nuevas.`);

      // 4. Generación por IA con lógica de clusters
      console.log("🧠 [4/7] Generando contenido con IA...");
      const { aiResponse, successfulCluster } = await this.generateContentWithClusters(
        newsContext.topicClusters,
        recentTitles
      );
      console.log("✨ Contenido generado exitosamente.");

      // 5. Generación de Imagen
      console.log("🎨 [5/7] Iniciando pipeline de imagen...");
      const imageUrls = await this.processImage(aiResponse, successfulCluster, allCategories);
      console.log(`🖼️ Imagen lista: ${imageUrls.url}`);

      // 6. Guardar en Base de Datos
      console.log("💾 [6/7] Guardando artículo en base de datos...");
      const newArticle = await this.saveToDatabase(aiResponse, imageUrls, newsContext.newsItems.length > 0);
      console.log(`✅ Artículo guardado con ID: ${newArticle.id} y slug: ${newArticle.slug}`);

      // 7. Post-procesado (Binance Square, etc.)
      console.log("📝 [7/7] Guardando metadata local para scripts externos...");
      await this.saveLocalMetadata(newArticle);


      console.log("\n✅ PROCESO COMPLETADO CON ÉXITO");
      return newArticle;

    } catch (error: any) {
      console.error("\n❌ ERROR CRÍTICO EN EL PIPELINE:", error);
      await sendCriticalErrorNotification(error);
      throw error;
    }
  }

  private async ensureCategories() {
    const categories = ["Criptomonedas", "IA", "Mercados", "Tecnología", "Ciberseguridad"];
    for (const name of categories) {
      await this.prisma.category.upsert({
        where: { name },
        update: {},
        create: {
          name,
          slug: generateSlug(name, false),
        },
      });
    }
  }

  private async getRecentContext() {
    const recentArticles = await this.prisma.article.findMany({
      select: { title: true, titleEn: true, sourceUrl: true },
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });
    
    const recentTitles = recentArticles.flatMap(a => {
      const titles = [a.title];
      if (a.titleEn) titles.push(a.titleEn);
      return titles;
    });

    const recentSourceUrls = recentArticles
      .map(a => a.sourceUrl)
      .filter((url): url is string => Boolean(url));

    return { recentTitles, recentSourceUrls };
  }

  private async generateContentWithClusters(topicClusters: any[][], recentTitles: string[]) {
    // Ordenar clusters por relevancia
    const sortedClusters = topicClusters.sort((a, b) => {
      if (b.length !== a.length) return b.length - a.length;
      return b[0].pubDate.getTime() - a[0].pubDate.getTime();
    });

    for (let i = 0; i < sortedClusters.length; i++) {
      const cluster = sortedClusters[i];
      try {
        console.log(`\n🎯 Intentando con Cluster ${i + 1}/${sortedClusters.length}...`);
        const aiResponse = await generateBilingualContent(recentTitles, cluster);
        if (aiResponse) {
          return { aiResponse, successfulCluster: cluster };
        }
      } catch (err: any) {
        console.warn(`⚠️ Cluster ${i + 1} falló: ${err.message}`);
      }
    }
    throw new Error('No se pudo generar contenido con ningún cluster de noticias.');
  }

  private async processImage(aiResponse: any, cluster: any[], allCategories: any[]) {
    const rssImageUrl = cluster[0]?.imageUrl || aiResponse.sourceImageUrl;
    const categoryName = aiResponse.category || allCategories[0].name;
    const slug = generateSlug(aiResponse.title, true);

    const imageResult = await generateArticleImageAndAnalyzeQA({
      title: aiResponse.title,
      slug,
      topic: categoryName,
      originalPrompt: aiResponse.imagePrompt,
      summary: aiResponse.summary
    }, rssImageUrl);

    return {
      url: imageResult.imageUrl,
      caption: imageResult.caption || aiResponse.imageCaption || `Ilustración sobre ${categoryName}`
    };
  }

  private async saveToDatabase(aiResponse: any, imageData: { url: string, caption: string }, hasNews: boolean) {
    const slug = generateSlug(aiResponse.title, true);
    const allCategories = await this.prisma.category.findMany();
    let selectedCategory = allCategories.find(
      (cat) => cat.name.toLowerCase() === (aiResponse.category || '').toLowerCase()
    ) || allCategories[0];

    const tagsArray = aiResponse.tags || [];

    return await this.prisma.article.create({
      data: {
        title: formatTitle(aiResponse.title),
        titleEn: formatTitle(aiResponse.titleEn),
        slug,
        summary: aiResponse.summary,
        summaryEn: aiResponse.summaryEn,
        keyPoints: aiResponse.keyPoints || [],
        keyPointsEn: aiResponse.keyPointsEn || [],
        impactLevel: aiResponse.impactLevel,
        complexity: aiResponse.complexity,
        tickers: aiResponse.tickers || [],
        glossary: aiResponse.glossary || [],
        glossaryEn: aiResponse.glossaryEn || [],
        faqs: aiResponse.faqs || [],
        faqsEn: aiResponse.faqsEn || [],
        content: aiResponse.content,
        contentEn: aiResponse.contentEn,
        articleTags: {
          connectOrCreate: tagsArray.map((tag: string) => ({
            where: { name: tag },
            create: { 
              name: tag, 
              slug: generateSlug(tag, false)
            }
          }))
        },
        imageUrl: imageData.url,
        imageCaption: imageData.caption,
        sourceUrl: aiResponse.sourceUrl || null,
        isOriginal: !hasNews,
        categoryId: selectedCategory.id,
        author: 'Carlos "Emérito" López Lovera',
        published: true,
        publishedAt: new Date(),
      },
      include: {
        category: true,
      }
    });
  }

  private async saveLocalMetadata(article: any) {
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    
    const articleData = {
      title: article.title,
      link: `https://www.emedoteme.es/articulo/${article.slug}`,
      description: article.content || article.summary,
      imageUrl: article.imageUrl
    };
    
    fs.writeFileSync(path.join(tmpDir, 'latest_article.json'), JSON.stringify(articleData, null, 2));
  }
}
