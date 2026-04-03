const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const article = await prisma.article.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { category: true }
  });
  console.log(JSON.stringify(article, null, 2));
}

main().finally(() => prisma.$disconnect());
