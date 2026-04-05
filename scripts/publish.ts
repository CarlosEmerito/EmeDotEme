import { generateArticleContent } from "@/services/ai.service";
import { createArticle } from "@/services/article.service";

async function main() {
  console.log("=====================================================");
  console.log("🚀 INICIANDO GENERACIÓN DE ARTÍCULO LOCAL (DEBUG) 🚀");
  console.log("=====================================================\n");

  try {
    // Generar contenido del artículo
    const article = await generateArticleContent();

    // Traducir el contenido al inglés
    const translatedArticle = await translateArticleContent(article);

    // Publicar el artículo en la base de datos
    await createArticle(translatedArticle);

    console.log("✅ Artículo publicado con éxito.");
  } catch (error) {
    console.error("❌ Error durante la generación y publicación del artículo:", error);
  }
}

main();
