import { PrismaClient } from '@prisma/client';
import { generateArticleContent } from './services/ai.service.js';
import { siteConfig } from './config/site.js';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando generación forzada de artículo...");
  try {
    const allCategories = await prisma.category.findMany();
    const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
    
    console.log("Categoría elegida:", randomCategory.name);
    
    const aiResponse = await generateArticleContent();
    
    const slug = aiResponse.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    const fallbackImages: Record<string, string[]> = {
      "Mercados": [
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop"
      ],
      "Tecnología": [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop"
      ],
      "Web3": [
        "https://images.unsplash.com/photo-1639762681485-074b7f4f039a?q=80&w=1200&auto=format&fit=crop"
      ]
    };

    let imageUrl = aiResponse.sourceImageUrl;
    if (!imageUrl) {
      const options = fallbackImages[randomCategory.name] || fallbackImages["Tecnología"];
      imageUrl = options[0];
    }

    const newArticle = await prisma.article.create({
      data: {
        title: aiResponse.title,
        slug: slug + '-' + Date.now(),
        summary: aiResponse.summary,
        content: aiResponse.content,
        imageUrl: imageUrl,
        imageCaption: aiResponse.imageCaption,
        categoryId: randomCategory.id,
        author: siteConfig.author,
        published: true,
      },
      include: {
        category: true,
      }
    });

    console.log("\n✅ ¡ARTÍCULO GENERADO Y GUARDADO!");
    console.log("Título:", newArticle.title);
    console.log("Autor:", newArticle.author);
    console.log("URL de Imagen:", newArticle.imageUrl);
    console.log("Pie de foto:", newArticle.imageCaption);
    console.log("Resumen:", newArticle.summary);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
