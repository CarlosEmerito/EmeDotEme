import { PrismaClient } from '@prisma/client';
import { generateArticleContent } from '../modules/ai/ai.service.js';
import { fetchLatestNews } from '../modules/news/news-sources.service.js';
import { siteConfig } from '../config/site.js';
import { generateSlug } from '../lib/utils.js';
import { FALLBACK_IMAGES } from '../config/constants.js';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando generación forzada de artículo...");
  try {
    const allCategories = await prisma.category.findMany();
    const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
    
    console.log("Categoría elegida:", randomCategory.name);
    
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
    
    // Generar artículo con contexto de noticias reales
    const aiResponse = await generateArticleContent(recentTitles, newsContext.newsItems);
    
    const slug = generateSlug(aiResponse.title, false);
    
    let imageUrl = aiResponse.sourceImageUrl;
    if (!imageUrl) {
      const options = FALLBACK_IMAGES[randomCategory.name] || FALLBACK_IMAGES["Mercados"];
      imageUrl = options[0];
    }

    const hasRealSources = newsContext.newsItems.length > 0;
    const tagsArray = aiResponse.tags || [];
    const newArticle = await prisma.article.create({
      data: {
        title: aiResponse.title,
        slug: slug + '-' + Date.now(),
        summary: aiResponse.summary,
        content: aiResponse.content,
        imageUrl: imageUrl,
        imageCaption: aiResponse.imageCaption,
        sourceUrl: aiResponse.sourceUrl || null,
        categoryId: randomCategory.id,
        author: siteConfig.author,
        published: true,
        publishedAt: new Date(),
        isOriginal: !hasRealSources,
        articleTags: {
          connectOrCreate: tagsArray.map((tag: string) => ({
            where: { name: tag },
            create: { 
              name: tag, 
              slug: tag.toLowerCase().replace(/\s+/g, '-') 
            }
          }))
        },
      },
      include: {
        category: true,
        articleTags: true,
      }
    });

    console.log("\n✅ ¡ARTÍCULO GENERADO Y GUARDADO!");
    console.log("Título:", newArticle.title);
    console.log("Autor:", newArticle.author);
    console.log("URL de Imagen:", newArticle.imageUrl);
    console.log("Pie de foto:", newArticle.imageCaption);
    console.log("Resumen:", newArticle.summary);
    if (newArticle.sourceUrl) {
      console.log("Fuente principal:", newArticle.sourceUrl);
    }
    console.log("Basado en fuentes reales:", !newArticle.isOriginal);
    console.log("Tags:", newArticle.articleTags.map(t => t.name));
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

