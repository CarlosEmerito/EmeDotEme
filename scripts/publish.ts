import 'dotenv/config';
import { generateArticleContent, translateArticleContent } from "../modules/ai/ai.service";
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

  const categories = ["Mercados", "Tecnología", "Web3", "IA", "Ciberseguridad"];
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
    
    const t0 = Date.now();
    let aiResponse: any = await generateArticleContent(recentTitles, newsContext.newsItems);
    
    // Si la IA devolvió el título de fallback estático, abortamos la ejecución
    // y enviamos un aviso al Telegram privado del administrador.
    if (aiResponse.title === 'Artículo de ejemplo') {
      console.error("\n❌ Ollama falló y devolvió el artículo de ejemplo. Abortando publicación...");
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
              text: `❌ <b>ERROR CRÍTICO (EmeDotEme Bot):</b>\n\nGemini excedió la cuota y Ollama local falló o hizo timeout de nuevo.\nLa publicación automática fue <b>ABORTADA</b> para evitar generar artículos falsos de ejemplo.\n\nRevisa los logs del servidor para más detalles.`,
              parse_mode: 'HTML'
            })
          });
          console.log("✅ Aviso de error enviado al Telegram privado.");
        } catch (tgErr) {
          console.error("❌ No se pudo avisar por Telegram:", tgErr);
        }
      } else {
          console.warn("⚠️ No hay credenciales de Telegram para enviar el aviso privado.");
      }
      process.exit(1);
    }

    console.log('📝 ImagePrompt presente:', aiResponse.imagePrompt ? 'SÍ' : 'NO');
    if (aiResponse.imagePrompt) {
      console.log('   Prompt:', aiResponse.imagePrompt.substring(0, 100) + '...');
    }
    aiResponse = await translateArticleContent(aiResponse);
    
    // Aplicar sentence case a los títulos
    // Post-procesado ortográfico por IA local (Ollama)
    const { postprocessWithOllama } = await import("../modules/ai/ai.service");
    aiResponse = await postprocessWithOllama(aiResponse);
    
    const t1 = Date.now();
    console.log(`\n⏱️ Tiempo de generación: ${((t1 - t0) / 1000).toFixed(2)} segundos`);

    const slug = generateSlug(aiResponse.title, true);

    // Procesar imagen con el pipeline: fuente RSS → AI Horde × 2 → Unsplash
    // Priorizar imagen de la fuente RSS sobre sourceImageUrl del AI
    const rssImageUrl = newsContext.newsItems[0]?.imageUrl || aiResponse.sourceImageUrl;
    
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
    
    try {
      const imageResult = await generateArticleImageAndAnalyzeQA(imageData, rssImageUrl);
      imageUrl = imageResult.imageUrl;
      imageCaption = imageResult.caption || aiResponse.imageCaption || `Ilustración sobre ${selectedCategory.name}`;
      console.log(`✅ Imagen final (${imageResult.source}): ${imageUrl.substring(0, 100)}...`);
      console.log(`   Pasos: ${imageResult.attempts.join(' → ')}`);
      if (imageResult.errors.length > 0) {
        console.log(`   Errores recuperados: ${imageResult.errors.join(', ')}`);
      }
    } catch (error) {
      console.error("❌ Error crítico en pipeline de imagen:", error);
      const options = FALLBACK_IMAGES[randomCategory.name] || FALLBACK_IMAGES["Tecnología"];
      imageUrl = options[Math.floor(Math.random() * options.length)];
      imageCaption = aiResponse.imageCaption || `Ilustración sobre ${randomCategory.name}`;
    }

    console.log("\n💾 Guardando en la Base de Datos...");
    const newArticle = await prisma.article.create({
      data: {
        title: aiResponse.title,
        titleEn: aiResponse.titleEn,
        slug: slug,
        summary: aiResponse.summary,
        summaryEn: aiResponse.summaryEn,
        content: aiResponse.content,
        contentEn: aiResponse.contentEn,
        tags: aiResponse.tags || [],
        imageUrl: imageUrl,
        imageCaption: imageCaption,
        sourceUrl: aiResponse.sourceUrl || null,
        isOriginal: !(newsContext.newsItems.length > 0),
        sentiment: aiResponse.sentiment || "Neutral ➡️",
        categoryId: selectedCategory.id,
        author: 'Carlos "Emérito" López Lovera',
        published: true,
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
    
  } catch (error) {
    console.error("\n❌ ERROR DURANTE EL PROCESO:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
