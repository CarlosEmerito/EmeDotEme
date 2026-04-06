import 'dotenv/config';
import { prisma } from '@/lib/prisma';

async function main() {
  console.log('Checking all articles for hashtags in content...');
  
  const articles = await prisma.article.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
      tags: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  
  console.log(`Total articles scanned: ${articles.length}`);
  
  let hashtagCount = 0;
  for (const article of articles) {
    const hashtags = article.content.match(/#[A-Za-záéíóúñÁÉÍÓÚÑ0-9]+/g) || [];
    if (hashtags.length > 0) {
      hashtagCount++;
      console.log(`\n❌ Article: ${article.title}`);
      console.log(`   Slug: ${article.slug}`);
      console.log(`   Created: ${article.createdAt}`);
      console.log(`   Hashtags: ${hashtags.join(', ')}`);
      console.log(`   Content snippet: ${article.content.substring(0, 200).replace(/\n/g, ' ')}...`);
    }
  }
  
  if (hashtagCount === 0) {
    console.log('\n✅ No articles with hashtags found in the latest 50 articles.');
  } else {
    console.log(`\n⚠️ Found ${hashtagCount} articles with hashtags in content.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());