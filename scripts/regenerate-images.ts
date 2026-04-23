import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { generateArticleImageAndAnalyzeQA } from '../modules/images/image.service';

const prisma = new PrismaClient();

async function regenerateImageForArticle(article: any) {
  const { title, slug, summary } = article;
  const topic = article.category?.name;
  console.log(`Regenerating image for: ${title}`);
  
  try {
    const result = await generateArticleImageAndAnalyzeQA(
      { title, slug, summary, topic },
      null // No hay imagen de fuente original
    );

    if (!result || !result.imageUrl) {
      throw new Error('Image pipeline returned no image URL');
    }
    
    // Update the article
    await prisma.article.update({
      where: { id: article.id },
      data: { imageUrl: result.imageUrl },
    });
    
    console.log(`✅ Updated article with new image URL: ${result.imageUrl} (Source: ${result.source})`);
    return result.imageUrl;
  } catch (error) {
    console.error(`❌ Failed to regenerate image for ${slug}:`, error);
    return null;
  }
}

async function main() {
  console.log('Fetching articles with expired Cloudflare R2 images...');
  const articles = await prisma.article.findMany({
    where: {
      imageUrl: {
        not: null,
        contains: 'r2.cloudflarestorage.com',
      },
    },
    include: {
      category: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${articles.length} articles with expired images.`);
  
  let success = 0;
  for (const article of articles) {
    if (!article.imageUrl) continue;
    console.log(`\n--- Processing: ${article.title} (${article.category.name})`);
    const result = await regenerateImageForArticle(article);
    if (result) success++;
    // Delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log(`\n✅ Regeneration complete: ${success}/${articles.length} successful.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());