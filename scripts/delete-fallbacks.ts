import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Buscando artículos de fallback generados...");

  const fallbacks = await prisma.article.findMany({
    where: {
      OR: [
        { title: { contains: "Análisis Urgente: El estado actual del mercado cripto" } },
        { title: { contains: "Perspectiva de los mercados: ¿Qué está pasando con Bitcoin y las altcoins?" } },
        { title: { contains: "Volatilidad en Web3: Entendiendo los movimientos recientes del mercado" } },
        { title: { contains: "Fallback" } }
      ]
    }
  });

  console.log(`Se encontraron ${fallbacks.length} artículos de fallback.`);

  for (const article of fallbacks) {
    console.log(`- Eliminando: ${article.title} (ID: ${article.id})`);
    await prisma.article.delete({
      where: { id: article.id }
    });
  }

  console.log("✅ Limpieza completada con éxito.");
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
