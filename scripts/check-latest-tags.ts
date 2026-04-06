import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking latest articles and their tags...');
  
  const articles = await prisma.article.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      tags: true,
      createdAt: true,
      categoryId: true,
      category: {
        select: {
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  
  console.log(`Latest ${articles.length} articles:`);
  articles.forEach((article, i) => {
    console.log(`\n${i+1}. ${article.title} (${article.category.name})`);
    console.log(`   Slug: ${article.slug}`);
    console.log(`   Created: ${article.createdAt.toISOString()}`);
    console.log(`   Tags: ${JSON.stringify(article.tags)}`);
    console.log(`   Tags count: ${article.tags?.length || 0}`);
    
    // Check if any tags contain hashtags
    if (article.tags && article.tags.length > 0) {
      const hashtagTags = article.tags.filter(tag => tag.includes('#'));
      if (hashtagTags.length > 0) {
        console.log(`   ⚠️ Tags with hashtags: ${hashtagTags.join(', ')}`);
      }
    }
  });
  
  // Also check for hashtags in content
  console.log('\n\nChecking for hashtags in recent article content...');
  const recentArticles = await prisma.article.findMany({
    select: {
      title: true,
      content: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });
  
  recentArticles.forEach(article => {
    const hashtagsInContent = (article.content.match(/#[A-Za-záéíóúñÁÉÍÓÚÑ0-9]+/g) || []);
    if (hashtagsInContent.length > 0) {
      console.log(`\n⚠️ Hashtags found in content of "${article.title}":`);
      console.log(`   ${hashtagsInContent.slice(0, 5).join(', ')}${hashtagsInContent.length > 5 ? `... (${hashtagsInContent.length} total)` : ''}`);
    }
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());