import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { announceNextApprovedArticle } from "../modules/publisher/announce.service";

/**
 * Saca el JSON del siguiente artículo aprobado pendiente de anunciar.
 *
 * Lo llama `publicar.sh` después de generar el borrador del día. Si no hay
 * ninguno aprobado, no escribe nada y los scripts de redes sociales se saltan
 * (por eso el script borra antes `tmp/latest_article.json`).
 */
const prisma = new PrismaClient();

async function main() {
  try {
    const article = await announceNextApprovedArticle(prisma);
    if (!article) {
      console.log("ℹ️ No hay artículos aprobados pendientes de anunciar. No se publica en redes.");
      return;
    }
    console.log(`📣 Aprobado y listo para anunciar: ${article.title}`);
    console.log(`   https://www.emedoteme.es/articulo/${article.slug}`);
  } catch (error) {
    console.error("❌ Fallo preparando el anuncio del artículo aprobado:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
