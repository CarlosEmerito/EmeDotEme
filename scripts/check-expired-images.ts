import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking all articles with image URLs...');
  
  const articles = await prisma.article.findMany({
    where: {
      imageUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      imageUrl: true,
      createdAt: true,
      category: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  console.log(`Total articles with images: ${articles.length}`);
  
  const r2Articles = articles.filter(a => a.imageUrl?.includes('r2.cloudflarestorage.com'));
  const supabaseArticles = articles.filter(a => a.imageUrl?.includes('supabase.co'));
  const unsplashArticles = articles.filter(a => a.imageUrl?.includes('unsplash.com'));
  const otherArticles = articles.filter(a => 
    a.imageUrl && 
    !a.imageUrl.includes('r2.cloudflarestorage.com') && 
    !a.imageUrl.includes('supabase.co') && 
    !a.imageUrl.includes('unsplash.com')
  );
  
  console.log(`\nBreakdown:`);
  console.log(`- Cloudflare R2 (expired): ${r2Articles.length}`);
  console.log(`- Supabase (permanent): ${supabaseArticles.length}`);
  console.log(`- Unsplash: ${unsplashArticles.length}`);
  console.log(`- Other: ${otherArticles.length}`);
  
  if (r2Articles.length > 0) {
    console.log('\n⚠️ Articles with Cloudflare R2 URLs (likely expired):');
    r2Articles.forEach(article => {
      console.log(`  - ${article.title} (${article.category.name})`);
      console.log(`    ${article.imageUrl}`);
    });
  }
  
  if (otherArticles.length > 0) {
    console.log('\nOther image sources:');
    otherArticles.forEach(article => {
      console.log(`  - ${article.title}: ${article.imageUrl?.substring(0, 80)}...`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());