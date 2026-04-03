import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Buscando artículos duplicados para eliminar...");

  const allArticles = await prisma.article.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const seenTitles = new Set();
  const duplicateIds = [];

  for (const article of allArticles) {
    if (seenTitles.has(article.title)) {
      duplicateIds.push(article.id);
      console.log(`Duplicado encontrado y marcado para borrar: ${article.title}`);
    } else {
      seenTitles.add(article.title);
    }
  }

  for (const id of duplicateIds) {
    await prisma.article.delete({ where: { id } });
    console.log(`- Eliminado artículo ID: ${id}`);
  }

  if (duplicateIds.length === 0) {
    console.log("No se encontraron artículos duplicados.");
  } else {
    console.log(`✅ ${duplicateIds.length} artículos duplicados eliminados.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
