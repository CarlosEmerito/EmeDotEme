import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = ["Criptomonedas", "Empresa", "IA", "Ciberseguridad"];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: {
        name,
        slug: name.toLowerCase().replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/\s+/g, '-'),
      },
    });
  }

  const allCategories = await prisma.category.findMany();

  const titles = [
    "Bitcoin rompe la barrera de los $100K: Análisis del mercado",
    "Ethereum lanza una nueva propuesta de mejora (EIP)",
    "Solana procesa un millón de transacciones por segundo en pruebas",
    "Nuevo marco regulatorio en la Unión Europea para criptoactivos",
    "La adopción institucional de DeFi alcanza máximos históricos"
  ];

  for (let i = 0; i < 5; i++) {
    const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
    const randomTitle = titles[i % titles.length];
    const slug = randomTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + i;

    await prisma.article.create({
      data: {
        title: randomTitle,
        slug: slug,
        summary: "La inteligencia artificial de EmeDotEme ha analizado los últimos movimientos del mercado y reporta hallazgos significativos en este sector.",
        content: "<p>Este es el contenido completo del artículo generado automáticamente. En un entorno de producción, este texto extenso sería redactado por un LLM tras analizar fuentes de datos en tiempo real.</p><p>Analizamos las tendencias, el volumen de operaciones y el sentimiento general del mercado para brindarte esta información de vanguardia.</p>",
        categoryId: randomCategory.id,
        author: "EmeDotEme AI",
        published: true,
      }
    });
  }

  console.log("Database seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });