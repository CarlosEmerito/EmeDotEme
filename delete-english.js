const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.article.deleteMany({
    where: {
      title: {
        contains: "Why Bitcoin"
      }
    }
  });
  console.log(`Se eliminaron ${result.count} artículo(s) en inglés.`);
}

main().finally(() => prisma.$disconnect());
