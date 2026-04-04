import { generateArticleContent, translateArticleContent } from "../services/ai.service";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("=====================================================");
  console.log("🚀 INICIANDO GENERACIÓN DE ARTÍCULO LOCAL (DEBUG) 🚀");
  console.log("=====================================================\n");

  const categories = ["Mercados", "Tecnología", "Web3"];
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
  const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];

  try {
    const t0 = Date.now();
    let aiResponse = await generateArticleContent();
    aiResponse = await translateArticleContent(aiResponse);
    const t1 = Date.now();
    console.log(`\n⏱️ Tiempo de generación: ${((t1 - t0) / 1000).toFixed(2)} segundos`);

    const slug = aiResponse.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();

    const fallbackImages: Record<string, string[]> = {
      "Mercados": [
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1605792657660-596af9009e82?q=80&w=1200&auto=format&fit=crop",
      ],
      "Tecnología": [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop",
      ],
      "Web3": [
        "https://images.unsplash.com/photo-1639762681485-074b7f4f039a?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?q=80&w=1200&auto=format&fit=crop"
      ]
    };

    let imageUrl = aiResponse.sourceImageUrl;
    if (!imageUrl) {
      const options = fallbackImages[randomCategory.name] || fallbackImages["Tecnología"];
      imageUrl = options[Math.floor(Math.random() * options.length)];
    }

    console.log("\n💾 Guardando en la Base de Datos...");
    const newArticle = await prisma.article.create({
      data: {
        title: aiResponse.title,
        titleEn: aiResponse.titleEn,
        slug: slug,
        summary: aiResponse.summary,
        summaryEn: aiResponse.summaryEn,
        content: aiResponse.content,
        contentEn: aiResponse.contentEn,
        tags: aiResponse.tags || [],
        imageUrl: imageUrl,
        imageCaption: aiResponse.imageCaption,
        sourceUrl: aiResponse.sourceUrl,
        sentiment: aiResponse.sentiment || "Neutral ➡️",
        categoryId: randomCategory.id,
        author: 'Carlos "Emérito" López Lovera',
        published: true,
      },
      include: {
        category: true,
      }
    });

    console.log("\n✅ ARTÍCULO PUBLICADO CON ÉXITO:");
    console.log(`- Título: ${newArticle.title}`);
    console.log(`- Sentimiento: ${newArticle.sentiment}`);
    console.log(`- Categoría: ${newArticle.category.name}`);
    console.log(`- URL Imagen: ${newArticle.imageUrl}`);
    console.log(`- Resumen: ${newArticle.summary}`);
    
    // Guardar un archivo temporal para Binance Square
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
    
    const articleData = {
      title: newArticle.title,
      link: `https://www.emedoteme.es/articulo/${newArticle.slug}`,
      description: newArticle.content || newArticle.summary,
      imageUrl: newArticle.imageUrl,
      sentiment: newArticle.sentiment
    };
    
    const jsonPath = path.join(tmpDir, 'latest_article.json');
    fs.writeFileSync(jsonPath, JSON.stringify(articleData, null, 2));
    console.log(`\n💾 Datos guardados en ${jsonPath} para Binance Square.`);
    
  } catch (error) {
    console.error("\n❌ ERROR DURANTE EL PROCESO:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
