import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { saveImageToSupabase } from '../modules/storage/supabase.service';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching articles with Cloudflare R2 images...');
  const articles = await prisma.article.findMany({
    where: {
      imageUrl: {
        not: null,
        contains: 'r2.cloudflarestorage.com',
      },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      imageUrl: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${articles.length} articles with Cloudflare R2 images.`);
  
  for (const article of articles) {
    if (!article.imageUrl) continue;
    const oldUrl = article.imageUrl;
    console.log(`\n--- Processing: ${article.title}`);
    console.log(`Current URL: ${oldUrl}`);
    
    try {
      const newUrl = await saveImageToSupabase(oldUrl, article.slug);
      if (newUrl !== oldUrl && newUrl.includes('supabase')) {
        console.log(`Uploaded to Supabase: ${newUrl}`);
        // Update the article
        await prisma.article.update({
          where: { id: article.id },
          data: { imageUrl: newUrl },
        });
        console.log('✅ Database updated.');
      } else {
        console.log('⚠️ No upload performed (already permanent or error).');
      }
    } catch (error) {
      console.error(`❌ Error processing article ${article.slug}:`, error);
    }
  }
  
  console.log('\nMigration completed.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());