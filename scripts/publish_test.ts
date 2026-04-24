import 'dotenv/config';
import { generateArticleContent, translateArticleContent } from "../modules/ai/ai.service";
import { fetchLatestNews } from "../modules/news/news-sources.service";
import { generateArticleImageAndAnalyzeQA } from "../modules/images/image.service";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
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
  const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];

  try {
    // Obtener títulos recientes para evitar repetición
    const recentArticles = await prisma.article.findMany({
      select: { title: true },
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const recentTitles = recentArticles.map((a: { title: string }) => a.title);
    console.log(`📰 Títulos recientes para evitar: ${recentTitles.length}`);
    
    // Fetch noticias reales de fuentes fiables
    const newsContext = await fetchLatestNews(recentTitles);
    console.log(`📰 Noticias obtenidas: ${newsContext.newsItems.length} de ${newsContext.sourcesResponded.join(', ') || 'ninguna fuente'}`);
    
    const t0 = Date.now();
    let aiResponse: any = await generateArticleContent(recentTitles, newsContext.newsItems);
    aiResponse = await translateArticleContent(aiResponse);
    const t1 = Date.now();
    console.log(`\n⏱️ Tiempo de generación: ${((t1 - t0) / 1000).toFixed(2)} segundos`);

    const slug = generateSlug(aiResponse.title, true);

    // Procesar imagen con el pipeline unificado
    const rssImageUrl = newsContext.newsItems[0]?.imageUrl || aiResponse.sourceImageUrl;
    
    const imageResult = await generateArticleImageAndAnalyzeQA({
      title: aiResponse.title,
      slug: slug,
      topic: randomCategory.name,
      originalPrompt: aiResponse.imagePrompt,
      summary: aiResponse.summary
    }, rssImageUrl, { testMode: true });

    console.log(`📊 RESUMEN IMAGEN: ${imageResult.imageUrl}`);
    console.log(`📊 FUENTE IMAGEN: ${imageResult.source}`);
    console.log(`📊 PASOS: ${imageResult.attempts.join(' → ')}`);

    console.log("\n💾 Saltando guardado en Base de Datos (MODO PRUEBA)...");
    
    const newArticle = {
      title: aiResponse.title,
      titleEn: aiResponse.titleEn,
      slug: slug,
      summary: aiResponse.summary,
      summaryEn: aiResponse.summaryEn,
      content: aiResponse.content,
      contentEn: aiResponse.contentEn,
      articleTags: aiResponse.tags ? aiResponse.tags.map((t: string) => ({ name: t })) : [],
      imageUrl: imageResult.imageUrl,
      imageCaption: imageResult.caption,
      sourceUrl: aiResponse.sourceUrl,
      sentiment: aiResponse.sentiment || "Neutral ➡️",
      category: { name: randomCategory.name },
      author: 'Carlos "Emérito" López Lovera',
      published: false,
    };

    console.log("\n✅ ARTÍCULO GENERADO CON ÉXITO (MODO PRUEBA):");
    console.log(`- Título: ${newArticle.title}`);
    console.log(`- Sentimiento: ${newArticle.sentiment}`);
    console.log(`- Categoría: ${newArticle.category.name}`);
    console.log(`- URL Imagen (${imageResult.source}): ${newArticle.imageUrl}`);
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
      imageUrl: imageResult.imageUrl,
      caption: imageResult.caption,
      sentiment: newArticle.sentiment,
      qaResult: imageResult.qaResult,
      source: imageResult.source,
      attempts: imageResult.attempts,
      errors: imageResult.errors,
    };

    const jsonPath = path.join(tmpDir, 'test_article.json');
    fs.writeFileSync(jsonPath, JSON.stringify(articleData, null, 2));
    console.log(`\n💾 Datos guardados en ${jsonPath} para Binance Square y QA visual.`);
    
  } catch (error) {
    console.error("\n❌ ERROR DURANTE EL PROCESO:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
