import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const confirm = process.argv.includes('--confirm');
  const unpublish = process.argv.includes('--unpublish');
  
  console.log("Buscando artículos con imágenes externas...");

  const allArticles = await prisma.article.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  const externalImageArticles = allArticles.filter(article => {
    if (!article.imageUrl) return false;
    if (article.imageUrl.includes('supabase.co')) return false;
    return true;
  });

  console.log(`Encontrados ${externalImageArticles.length} artículos con imágenes externas:`);
  
  for (const article of externalImageArticles) {
    console.log(`- "${article.title}" (ID: ${article.id})`);
    console.log(`  URL: ${article.imageUrl}`);
    console.log(`  Creado: ${article.createdAt.toISOString().split('T')[0]}`);
  }

  if (externalImageArticles.length === 0) {
    console.log("✅ No hay artículos con imágenes externas.");
    return;
  }

  if (!confirm && !unpublish) {
    console.log("\n⚠️  Para eliminar estos artículos, ejecuta:");
    console.log("   npm run delete-external-images -- --confirm");
    console.log("\n⚠️  Para despublicarlos (published: false), ejecuta:");
    console.log("   npm run delete-external-images -- --unpublish");
    return;
  }

  if (confirm) {
    console.log("\n🚨 ELIMINANDO ARTÍCULOS...");
    for (const article of externalImageArticles) {
      await prisma.article.delete({ where: { id: article.id } });
      console.log(`✅ Eliminado: ${article.title}`);
    }
    console.log(`\n✅ ${externalImageArticles.length} artículos eliminados.`);
  } else if (unpublish) {
    console.log("\n🚨 DESPUBLICANDO ARTÍCULOS...");
    for (const article of externalImageArticles) {
      await prisma.article.update({
        where: { id: article.id },
        data: { published: false }
      });
      console.log(`✅ Despublicado: ${article.title}`);
    }
    console.log(`\n✅ ${externalImageArticles.length} artículos despublicados.`);
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