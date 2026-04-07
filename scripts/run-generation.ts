import { generateArticleContent } from '../modules/ai/ai.service.js';
import { fetchLatestNews } from '../modules/news/news-sources.service.js';
import { PrismaClient } from '@prisma/client';
import { generateSlug } from '../lib/utils.js';

const prisma = new PrismaClient();

async function main() {
  console.log("Generando articulo con IA...");
  
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
  console.log("Articulo generado. Insertando en BD...");

  let category = await prisma.category.findFirst({ where: { name: "Web3" } });
  if (!category) {
    category = await prisma.category.create({ data: { name: "Web3", slug: "web3" } });
  }

  const slug = generateSlug(aiResponse.title, true);

  const hasRealSources = newsContext.newsItems.length > 0;
  const newArticle = await prisma.article.create({
    data: {
      title: aiResponse.title,
      slug: slug,
      summary: aiResponse.summary,
      content: aiResponse.content,
      imageUrl: aiResponse.sourceImageUrl || 'https://via.placeholder.com/800',
      imageCaption: aiResponse.imageCaption,
      sourceUrl: aiResponse.sourceUrl || null,
      categoryId: category.id,
      author: 'Carlos "Emérito" López Lovera',
      published: true,
      isOriginal: !hasRealSources,
      tags: aiResponse.tags || [],
    }
  });

  console.log("--- RESULTADO DE LA BASE DE DATOS ---");
  console.log(JSON.stringify(newArticle, null, 2));
  if (newArticle.sourceUrl) {
    console.log(`\n📎 Fuente principal: ${newArticle.sourceUrl}`);
  }
  console.log(`📰 Basado en fuentes reales: ${!newArticle.isOriginal}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});

