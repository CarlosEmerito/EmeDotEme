import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const latest = await prisma.article.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { title: true, content: true, summary: true, createdAt: true, slug: true },
  });
  if (latest) {
    console.log('Latest article:', latest.title);
    console.log('Created:', latest.createdAt);
    console.log('Slug:', latest.slug);
    console.log('Content length:', latest.content.length);
    console.log('Last 100 chars of content:', latest.content.slice(-100));
    console.log('Has #Criptomonedas?', latest.content.includes('#Criptomonedas'));
    console.log('Has #Web3?', latest.content.includes('#Web3'));
    console.log('Has #EmeDotEme?', latest.content.includes('#EmeDotEme'));
  } else {
    console.log('No articles found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());