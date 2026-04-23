import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { category: true }
  });

  console.log(JSON.stringify(articles, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
