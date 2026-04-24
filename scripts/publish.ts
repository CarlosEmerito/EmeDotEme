import 'dotenv/config';
import { generateBilingualContent } from "../modules/ai/ai.service";
import { fetchLatestNews } from "../modules/news/news-sources.service";
import { generateArticleImageAndAnalyzeQA } from "../modules/images/image.service";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import path from "path";
import { FALLBACK_IMAGES } from "../config/constants";
import { generateSlug } from "../lib/utils";

const prisma = new PrismaClient();



async function main() {
  console.log("=====================================================");
  console.log("🚀 INICIANDO GENERACIÓN DE ARTÍCULO LOCAL (DEBUG) 🚀");
  console.log("=====================================================\n");

  const categories = ["Criptomonedas", "IA", "Mercados", "Tecnología", "Ciberseguridad"];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: {
        name,
        slug: name.toLowerCase().replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/\s+/g, '-'),
      },
    });
  }

  const allCategories = await prisma.category.findMany();


  try {
    // Obtener títulos (ES y EN) y URLs recientes para evitar repetición
    const recentArticles = await prisma.article.findMany({
      select: { title: true, titleEn: true, sourceUrl: true },
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 20, // Aumentado para mayor cobertura de deduplicación
    });
    
    // Unir títulos en español y en inglés para aumentar las coincidencias con el RSS (que suele estar en inglés)
    const recentTitles = recentArticles.flatMap((a: { title: string; titleEn: string | null }) => {
      const titles = [a.title];
      if (a.titleEn) titles.push(a.titleEn);
      return titles;
    });
    const recentSourceUrls = recentArticles
      .map((a: { sourceUrl: string | null }) => a.sourceUrl)
      .filter((url: string | null): url is string => Boolean(url));
      
    console.log(`📰 Títulos recientes para evitar: ${recentTitles.length}`);
    console.log(`📰 URLs recientes para evitar: ${recentSourceUrls.length}`);
    
    // Fetch noticias reales de fuentes fiables
    const newsContext = await fetchLatestNews(recentTitles, recentSourceUrls);
    console.log(`📰 Noticias obtenidas: ${newsContext.newsItems.length} de ${newsContext.sourcesResponded.join(', ') || 'ninguna fuente'}`);
    
    if (newsContext.newsItems.length === 0) {
      console.log('✅ No hay noticias nuevas para cubrir en este momento. Saliendo con éxito.');
      process.exit(0);
    }

    const t0 = Date.now();

    // Agrupar por tema y ordenar por calidad (más fuentes primero)
    const topicClusters = newsContext.topicClusters.sort((a, b) => {
      if (b.length !== a.length) return b.length - a.length;
      return b[0].pubDate.getTime() - a[0].pubDate.getTime();
    });

    let aiResponse: any = null;
    let successfulCluster: any[] = [];

    // Intentar con cada cluster hasta que uno funcione
    for (let i = 0; i < topicClusters.length; i++) {
      const currentCluster = topicClusters[i];
      console.log(`\n🎯 Intentando con Cluster ${i + 1}/${topicClusters.length}: "${currentCluster[0].title.substring(0, 60)}..."`);
      
      try {
        aiResponse = await generateBilingualContent(recentTitles, currentCluster);
        if (aiResponse) {
          successfulCluster = currentCluster;
          console.log(`✅ Generación exitosa con Cluster ${i + 1}`);
          break;
        }
      } catch (err: any) {
        console.warn(`⚠️ Cluster ${i + 1} falló: ${err.message}`);
        if (i === topicClusters.length - 1) {
          throw new Error('❌ Todos los clusters fallaron la generación por IA.');
        }
        console.log('🔄 Intentando con el siguiente cluster disponible...');
      }
    }

    if (!aiResponse) {
      throw new Error('No se pudo generar contenido con ningún cluster de noticias.');
    }
    
    console.log('📝 ImagePrompt presente:', aiResponse.imagePrompt ? 'SÍ' : 'NO');
    if (aiResponse.imagePrompt) {
      console.log('   Prompt:', aiResponse.imagePrompt.substring(0, 100) + '...');
    }
    
    // Post-procesado ortográfico por IA local (Ollama) - solo español

    console.log("\n🔍 Post-procesando texto con Ollama para mejorar ortografía y estilo...");
    const { postprocessWithOllama } = await import("../modules/ai/ai.service");
    aiResponse = await postprocessWithOllama(aiResponse);
    
    const t1 = Date.now();
    console.log(`\n⏱️ Tiempo de generación: ${((t1 - t0) / 1000).toFixed(2)} segundos`);

    const slug = generateSlug(aiResponse.title, true);

    // Procesar imagen con el pipeline: fuente RSS → Flux Local → AI Horde
    // Priorizar imagen de la fuente RSS sobre sourceImageUrl del AI
    const rssImageUrl = successfulCluster[0]?.imageUrl || aiResponse.sourceImageUrl;
    
    // Determinar la categoría sugerida por la IA
    let selectedCategory = allCategories.find(
      (cat) => cat.name.toLowerCase() === (aiResponse.category || '').toLowerCase()
    );
    if (!selectedCategory) {
      // Si la IA no sugiere una categoría válida, usar la primera por defecto
      selectedCategory = allCategories[0];
    }

    const imageData = {
      title: aiResponse.title,
      slug: slug,
      topic: selectedCategory.name,
      originalPrompt: aiResponse.imagePrompt,
      summary: aiResponse.summary
    };
    
    let imageUrl: string;
    let imageCaption: string;
    
    const imageResult = await generateArticleImageAndAnalyzeQA(imageData, rssImageUrl);
    imageUrl = imageResult.imageUrl;
    imageCaption = imageResult.caption || aiResponse.imageCaption || `Ilustración sobre ${selectedCategory.name}`;
    console.log(`✅ Imagen final (${imageResult.source}): ${imageUrl.substring(0, 100)}...`);
    console.log(`   Pasos: ${imageResult.attempts.join(' → ')}`);
    if (imageResult.errors.length > 0) {
      console.log(`   Errores recuperados: ${imageResult.errors.join(', ')}`);
    }

    console.log("\n💾 Guardando en la Base de Datos...");
    const tagsArray = aiResponse.tags || [];
    const newArticle = await prisma.article.create({
      data: {
        title: aiResponse.title,
        titleEn: aiResponse.titleEn,
        slug: slug,
        summary: aiResponse.summary,
        summaryEn: aiResponse.summaryEn,
        content: aiResponse.content,
        contentEn: aiResponse.contentEn,
        articleTags: {
          connectOrCreate: tagsArray.map((tag: string) => ({
            where: { name: tag },
            create: { 
              name: tag, 
              slug: tag.toLowerCase().replace(/\s+/g, '-') 
            }
          }))
        },
        imageUrl: imageUrl,
        imageCaption: imageCaption,
        sourceUrl: aiResponse.sourceUrl || null,
        isOriginal: !(newsContext.newsItems.length > 0),
        sentiment: aiResponse.sentiment || "Neutral ➡️",
        categoryId: selectedCategory.id,
        author: 'Carlos "Emérito" López Lovera',
        published: true,
        publishedAt: new Date(),
      },
      include: {
        category: true,
      }
    });

    console.log("\n✅ ARTÍCULO PUBLICADO CON ÉXITO:");
    console.log(`- Título: ${newArticle.title}`);
    console.log(`- Sentimiento: ${newArticle.sentiment}`);
    console.log(`- Categoría: ${newArticle.category.name}`);
    console.log(`- URL Imagen: ${newArticle.imageUrl}`);
    console.log(`- Resumen: ${newArticle.summary}`);
    
    // Guardar un archivo temporal para Binance Square
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
    
    const articleData = {
      title: newArticle.title,
      link: `https://www.emedoteme.es/articulo/${newArticle.slug}`,
      description: newArticle.content || newArticle.summary,
      imageUrl: newArticle.imageUrl,
      sentiment: newArticle.sentiment
    };
    
    const jsonPath = path.join(tmpDir, 'latest_article.json');
    fs.writeFileSync(jsonPath, JSON.stringify(articleData, null, 2));
    console.log(`\n💾 Datos guardados en ${jsonPath} para Binance Square.`);
    
  } catch (error: any) {
    console.error("\n❌ ERROR DURANTE EL PROCESO:", error);
    
    // Notificar error por Telegram
    const tgToken = process.env.TELEGRAM_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;
    if (tgToken && tgChatId) {
      try {
        const fetchNode = (await import('node-fetch')).default;
        await fetchNode(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: tgChatId,
            text: `❌ <b>ERROR CRÍTICO (EmeDotEme Bot):</b>\n\nEl proceso de publicación falló y fue abortado para preservar la calidad.\n\n<b>Error:</b> ${error.message || error}`,
            parse_mode: 'HTML'
          })
        });
        console.log("✅ Notificación de error enviada a Telegram.");
      } catch (tgErr) {
        console.error("❌ No se pudo notificar el error por Telegram:", tgErr);
      }
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
