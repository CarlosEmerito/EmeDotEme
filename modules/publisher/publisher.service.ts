import { PrismaClient } from "@prisma/client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateBilingualContent } from "../ai/ai.service";
import { fetchLatestNews } from "../news/news-sources.service";
import { generateArticleImageAndAnalyzeQA, IMAGE_SOURCE_LABEL, type ImageSource, type RecentImage } from "../images/image.service";
import { generateSlug, ensureUniqueSlug, formatTitle } from "../../lib/utils";
import { sendCriticalErrorNotification, sendApprovalRequest } from "../notifications/telegram.service";
import { BASE_CATEGORIES } from "../../config/constants";
import { buildPreviewUrl, generateReviewToken, REVIEW_STATUS } from "../../lib/review-token";

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
      const { recentTitles, recentSourceUrls, recentImages } = await this.getRecentContext();
      
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
      const { aiResponse } = await this.generateContentWithClusters(
        newsContext.topicClusters,
        recentTitles
      );
      console.log("✨ Contenido generado exitosamente.");

      // 4b. Generar Slug Único (limpio, sin timestamp, con sufijo si colisiona)
      const slug = await ensureUniqueSlug(
        generateSlug(aiResponse.title, false),
        async (candidate) =>
          Boolean(await this.prisma.article.findUnique({ where: { slug: candidate }, select: { id: true } }))
      );

      // 5. Generación de Imagen
      console.log("🎨 [5/7] Iniciando pipeline de imagen...");
      const imageInfo = await this.processImage(aiResponse, allCategories, slug, recentImages);
      console.log(`🖼️ Imagen lista (${imageInfo.source}): ${imageInfo.url}`);

      // 6. Guardar en Base de Datos (como borrador: NO se publica todavía)
      console.log("💾 [6/7] Guardando borrador en base de datos...");
      const newArticle = await this.saveToDatabase(aiResponse, imageInfo, newsContext.newsItems.length > 0, slug);
      console.log(`✅ Borrador guardado con ID: ${newArticle.id} y slug: ${newArticle.slug}`);

      // 7. Pedir la aprobación editorial por Telegram, con el enlace privado
      console.log("📨 [7/7] Pidiendo aprobación por Telegram...");
      await this.requestApproval(newArticle, imageInfo);

      console.log("\n✅ BORRADOR LISTO. Nada se ha publicado: espera tu sí/no en Telegram.");
      return newArticle;

    } catch (error: any) {
      console.error("\n❌ ERROR CRÍTICO EN EL PIPELINE:", error);
      await sendCriticalErrorNotification(error);
      throw error;
    }
  }

  private async ensureCategories() {
    const categories = [...BASE_CATEGORIES];
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
      select: { title: true, titleEn: true, sourceUrl: true, imageUrl: true, published: true },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    // Títulos y URLs de origen: solo de lo publicado (una noticia descartada
    // sigue siendo noticia y podrá cubrirse más adelante).
    const published = recentArticles.filter((a) => a.published);

    const recentTitles = published.flatMap(a => {
      const titles = [a.title];
      if (a.titleEn) titles.push(a.titleEn);
      return titles;
    });

    const recentSourceUrls = published
      .map(a => a.sourceUrl)
      .filter((url): url is string => Boolean(url));

    // Imágenes recientes: de todos los artículos, publicados o no. Un borrador
    // descartado también dejó su foto puesta, y no queremos repetirla.
    const recentImages: RecentImage[] = recentArticles
      .map((a) => ({ url: a.imageUrl, title: a.title }))
      .filter((item): item is RecentImage => Boolean(item.url));

    return { recentTitles, recentSourceUrls, recentImages };
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

  private async processImage(
    aiResponse: any,
    allCategories: any[],
    slug: string,
    recentlyUsedImages: RecentImage[]
  ) {
    const categoryName = aiResponse.category || allCategories[0].name;

    const imageResult = await generateArticleImageAndAnalyzeQA({
      title: aiResponse.title,
      slug,
      topic: categoryName,
      originalPrompt: aiResponse.imagePrompt,
      summary: aiResponse.summary,
      recentlyUsedImages,
    });

    return {
      url: imageResult.imageUrl,
      caption: imageResult.caption || aiResponse.imageCaption || `Ilustración sobre ${categoryName}`,
      source: imageResult.source,
      errors: imageResult.errors,
      duplicateOf: imageResult.duplicateOf,
    };
  }

  private async saveToDatabase(aiResponse: any, imageData: { url: string, caption: string }, hasNews: boolean, slug: string) {
    const allCategories = await this.prisma.category.findMany();
    const selectedCategory = allCategories.find(
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
            // Se busca por slug (no por name) para deduplicar etiquetas cuyo
            // nombre generado por la IA difiere en grafía/mayúsculas de una
            // ya existente pero normaliza al mismo slug (evita un choque de
            // Tag.slug @unique que Prisma reporta como si fuera Article.slug).
            where: { slug: generateSlug(tag, false) },
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
        // El artículo nace como borrador privado: `published: false` lo deja
        // fuera de la web y `reviewToken` es la única puerta al enlace privado
        // y a los botones de Telegram. Se publica cuando Emérito pulsa «Sí».
        published: false,
        publishedAt: null,
        reviewStatus: REVIEW_STATUS.pending,
        reviewToken: generateReviewToken(),
      },
      include: {
        category: true,
        articleTags: true,
      }
    });
  }

  /**
   * Manda al Telegram de Emérito el borrador con su enlace privado y los tres
   * botones (sí / no / EmeDotHermes). Deja el enlace también en el log para que
   * el flujo no dependa de que el mensaje llegue.
   */
  private async requestApproval(
    article: any,
    imageInfo: { url: string; caption: string; source: ImageSource; errors: string[]; duplicateOf: string | null }
  ) {
    const baseUrl = process.env.SITE_URL || 'https://www.emedoteme.es';
    const previewUrl = buildPreviewUrl(baseUrl, article.reviewToken);

    // Cómo se ha obtenido la imagen y qué dice el pie de foto. Se le enseña a
    // quien aprueba, no al lector: en la web el pie solo describe la imagen.
    const detalles = imageInfo.errors.slice(0, 2).join('; ');
    const imageNote = `🖼️ Imagen: ${IMAGE_SOURCE_LABEL[imageInfo.source]}${
      imageInfo.source === 'fallback_static' && detalles ? ` (${detalles})` : ''
    }`;

    const sent = await sendApprovalRequest({
      title: article.title,
      summary: article.summary,
      imageUrl: article.imageUrl,
      category: article.category?.name,
      previewUrl,
      token: article.reviewToken,
      wordCount: String(article.content || '').split(/\s+/).length,
      tags: article.articleTags ? article.articleTags.map((t: any) => t.name) : [],
      imageNote,
      imageCaption: imageInfo.caption,
      imageWarning: imageInfo.duplicateOf
        ? `⚠️ Ya se usó en «${imageInfo.duplicateOf}» y no había otra disponible.`
        : undefined,
    });

    if (sent) {
      // Nunca se imprime el enlace completo: los logs de Actions de un
      // repositorio público son públicos, y ese enlace da acceso al borrador.
      console.log(`🔒 Petición de aprobación enviada (token ${String(article.reviewToken).slice(0, 6)}…)`);
    } else {
      console.warn('⚠️ No se pudo enviar la petición de aprobación. El borrador queda pendiente en la web.');
    }
    return previewUrl;
  }
}
