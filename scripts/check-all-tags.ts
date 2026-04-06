import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking all articles for tags...');
  
  const articles = await prisma.article.findMany({
    select: {
      title: true,
      tags: true,
      createdAt: true,
    },
    where: {
      tags: {
        isEmpty: false,
      }
    },
    orderBy: { createdAt: 'desc' },
  });
  
  console.log(`Articles with non-empty tags: ${articles.length}`);
  
  if (articles.length > 0) {
    articles.forEach((article, i) => {
      console.log(`\n${i+1}. ${article.title}`);
      console.log(`   Created: ${article.createdAt.toISOString()}`);
      console.log(`   Tags: ${JSON.stringify(article.tags)}`);
    });
  } else {
    console.log('\nNo articles have tags!');
  }
  
  // Also check total articles
  const total = await prisma.article.count();
  console.log(`\nTotal articles in database: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());