import { generateArticleContent } from './modules/ai/ai.service.js';
import { PrismaClient } from '@prisma/client';

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
  const recentTitles = recentArticles.map(a => a.title);
  console.log(`📰 Títulos recientes para evitar: ${recentTitles.length}`);
  
  const aiResponse = await generateArticleContent(recentTitles);
  console.log("Articulo generado. Insertando en BD...");

  let category = await prisma.category.findFirst({ where: { name: "Web3" } });
  if (!category) {
    category = await prisma.category.create({ data: { name: "Web3", slug: "web3" } });
  }

  const slug = aiResponse.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();

  const newArticle = await prisma.article.create({
    data: {
      title: aiResponse.title,
      slug: slug,
      summary: aiResponse.summary,
      content: aiResponse.content,
      imageUrl: aiResponse.sourceImageUrl || 'https://via.placeholder.com/800',
      imageCaption: aiResponse.imageCaption,
      categoryId: category.id,
      author: 'Carlos "Emérito" López Lovera',
      published: true,
    }
  });

  console.log("--- RESULTADO DE LA BASE DE DATOS ---");
  console.log(JSON.stringify(newArticle, null, 2));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
