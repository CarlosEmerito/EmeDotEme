import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { generateArticleContent } from "@/modules/ai/ai.service";

export const maxDuration = 300; // Allow up to 5 minutes for AI generation

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 1. Asegurar que existan categorías base
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

    // Obtener títulos recientes para evitar repetición
    const recentArticles = await prisma.article.findMany({
      select: { title: true },
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const recentTitles = recentArticles.map(a => a.title);
    console.log(`📰 Títulos recientes para evitar: ${recentTitles.length}`);

    // 2. Llamada al servicio de IA
    const aiResponse = await generateArticleContent(recentTitles);
    
    const slug = aiResponse.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Fallback images if no image was extracted from the RSS feed
    const fallbackImages: Record<string, string[]> = {
      "Mercados": [
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1605792657660-596af9009e82?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1641337424160-5a3d7d745fcd?q=80&w=1200&auto=format&fit=crop"
      ],
      "Tecnología": [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop"
      ],
      "Web3": [
        "https://images.unsplash.com/photo-1639762681485-074b7f4f039a?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1639762681057-408e52192e55?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?q=80&w=1200&auto=format&fit=crop"
      ]
    };

    let imageUrl = aiResponse.sourceImageUrl;
    if (!imageUrl) {
      const options = fallbackImages[randomCategory.name] || fallbackImages["Tecnología"];
      imageUrl = options[Math.floor(Math.random() * options.length)];
    }

    // 3. Guardar el artículo generado en la base de datos
    const newArticle = await prisma.article.create({
      data: {
        title: aiResponse.title,
        slug: slug + '-' + Date.now(), // Para evitar duplicados en la demo
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

    return NextResponse.json({ success: true, article: newArticle }, { status: 201 });
  } catch (error) {
    console.error("Error generating article:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}