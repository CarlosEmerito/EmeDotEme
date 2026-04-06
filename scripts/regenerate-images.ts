import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { generateImageWithAIHorde } from '../modules/ai/aihorde-image.service.ts';
import { saveImageToSupabase } from '../modules/images/image.service.ts';

const prisma = new PrismaClient();

async function regenerateImageForArticle(article: any) {
  const { title, slug, category } = article;
  console.log(`Regenerating image for: ${title}`);
  
  // Create a simple prompt based on title and category
  const prompt = `${title}. Ilustración profesional, alta calidad, sin texto, sin marcas de agua, estilo realista.`;
  console.log(`Prompt: ${prompt}`);
  
  try {
    const tempUrl = await generateImageWithAIHorde(prompt, slug);
    if (!tempUrl) {
      throw new Error('AI Horde returned no image URL');
    }
    console.log(`AI Horde temporary URL: ${tempUrl.substring(0, 100)}...`);
    
    // Upload to Supabase for permanence
    const permanentUrl = await saveImageToSupabase(tempUrl, slug);
    if (!permanentUrl.includes('supabase')) {
      console.warn(`Upload may have failed, using temporary URL: ${permanentUrl}`);
    }
    
    // Update the article
    await prisma.article.update({
      where: { id: article.id },
      data: { imageUrl: permanentUrl },
    });
    
    console.log(`✅ Updated article with new image URL: ${permanentUrl}`);
    return permanentUrl;
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