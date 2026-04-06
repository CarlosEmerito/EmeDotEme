import 'dotenv/config';
import { generateArticleContent, translateArticleContent } from "../modules/ai/ai.service";
import { generateArticleImageAndAnalyzeQA } from "../modules/images/image.service";
import { generateImageWithAIHorde } from "../modules/ai/aihorde-image.service";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("=====================================================");
  console.log("🚀 INICIANDO GENERACIÓN DE ARTÍCULO LOCAL (DEBUG) 🚀");
  console.log("=====================================================\n");

  const categories = ["Mercados", "Tecnología", "Web3"];
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
    const recentTitles = recentArticles.map(a => a.title);
    console.log(`📰 Títulos recientes para evitar: ${recentTitles.length}`);
    
    const t0 = Date.now();
    let aiResponse = await generateArticleContent(recentTitles);
    aiResponse = await translateArticleContent(aiResponse);
    const t1 = Date.now();
    console.log(`\n⏱️ Tiempo de generación: ${((t1 - t0) / 1000).toFixed(2)} segundos`);

    const slug = aiResponse.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();

    const fallbackImages: Record<string, string[]> = {
      "Mercados": [
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1605792657660-596af9009e82?q=80&w=1200&auto=format&fit=crop",
      ],
      "Tecnología": [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop",
      ],
      "Web3": [
        "https://images.unsplash.com/photo-1639762681485-074b7f4f039a?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?q=80&w=1200&auto=format&fit=crop"
      ]
    };

    let imageUrl = aiResponse.sourceImageUrl;
    let imageSource = "sourceImageUrl original";
    
    // INTENTAR GENERAR IMAGEN CON AI HORDE (gratuito, comunitario)
    if (aiResponse.imagePrompt) {
      console.log("\n🎨 INTENTANDO GENERAR IMAGEN CON AI HORDE...");
      console.log(`📝 Prompt: ${aiResponse.imagePrompt}`);
      
      const aiHordeImageUrl = await generateImageWithAIHorde(
        aiResponse.imagePrompt,
        slug,
        {}  // Use DEFAULT_PARAMS from service (max quality)
      );
      
      if (aiHordeImageUrl) {
        imageUrl = aiHordeImageUrl;
        imageSource = "AI Horde (comunitario)";
        console.log(`✅ IMAGEN GENERADA CON AI HORDE: ${imageUrl}`);
      } else {
        console.log("❌ AI Horde falló, intentando con Stable Diffusion local...");
        
         // Ya no se usa Stable Diffusion local: eliminada lógica legacy.
         // TODO: todo el flujo se hace con generateArticleImageAndAnalyzeQA.

      }
    }

    // Fallback final a Unsplash
    if (!imageUrl) {
      console.log("⚠️ Usando imagen fallback de Unsplash...");
      const options = fallbackImages[randomCategory.name] || fallbackImages["Tecnología"];
      imageUrl = options[Math.floor(Math.random() * options.length)];
      imageSource = "Unsplash fallback";
    }
    
    console.log(`📊 RESUMEN IMAGEN: ${imageUrl}`);
    console.log(`📊 FUENTE IMAGEN: ${imageSource}`);

    console.log("\n💾 Saltando guardado en Base de Datos (MODO PRUEBA)...");
    
    // Simular el objeto creado para evitar tocar la DB
    const newArticle = {
      title: aiResponse.title,
      titleEn: aiResponse.titleEn,
      slug: slug,
      summary: aiResponse.summary,
      summaryEn: aiResponse.summaryEn,
      content: aiResponse.content,
      contentEn: aiResponse.contentEn,
      tags: aiResponse.tags || [],
      imageUrl: imageUrl,
      imageCaption: aiResponse.imageCaption,
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
    console.log(`- URL Imagen (${imageSource}): ${newArticle.imageUrl}`);
    console.log(`- Resumen: ${newArticle.summary}`);
    
    // Guardar un archivo temporal para Binance Square
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
    
    // Ejecutar el pipeline completo de imagen y QA
    const imageResult = await generateArticleImageAndAnalyzeQA({
      title: aiResponse.title,
      slug: slug,
      topic: randomCategory.name,
      originalPrompt: aiResponse.imagePrompt,
      summary: aiResponse.summary
    }, aiResponse.sourceImageUrl, { testMode: true });

    const articleData = {
      title: newArticle.title,
      link: `https://www.emedoteme.es/articulo/${newArticle.slug}`,
      description: newArticle.content || newArticle.summary,
      imageUrl: imageResult.imageUrl,
      caption: imageResult.caption,
      sentiment: newArticle.sentiment,
      mainQA: imageResult.mainQA,
      originalQA: imageResult.originalQA,
      flows: imageResult.flows,
      usedFallback: imageResult.usedFallback,
      errors: imageResult.errors
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
