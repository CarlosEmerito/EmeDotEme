import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { generateArticleContent } from "@/modules/ai/ai.service";
import { fetchLatestNews } from "@/modules/news/news-sources.service";

export const maxDuration = 300; // Allow up to 5 minutes for AI generation + RSS fetch

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
    const recentTitles = recentArticles.map((a: { title: string }) => a.title);
    console.log(`📰 Títulos recientes para evitar: ${recentTitles.length}`);

    // 2. Fetch noticias reales de fuentes fiables
    const newsContext = await fetchLatestNews(recentTitles);
    console.log(`📰 Noticias obtenidas: ${newsContext.newsItems.length} de ${newsContext.sourcesResponded.join(', ') || 'ninguna fuente'}`);

    // 3. Llamada al servicio de IA con contexto de noticias reales
    const aiResponse = await generateArticleContent(recentTitles, newsContext.newsItems);
    
    const slug = aiResponse.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Fallback images if no image was extracted
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

    // 4. Guardar el artículo generado con fuentes
    const hasRealSources = newsContext.newsItems.length > 0;
    const newArticle = await prisma.article.create({
      data: {
        title: aiResponse.title,
        slug: slug + '-' + Date.now(),
        summary: aiResponse.summary,
        content: aiResponse.content,
        imageUrl: imageUrl,
        imageCaption: aiResponse.imageCaption,
        sourceUrl: aiResponse.sourceUrl || null,
        categoryId: randomCategory.id,
        author: siteConfig.author,
        published: true,
        isOriginal: !hasRealSources, // false si se basa en fuentes externas
        tags: aiResponse.tags || [],
      },
      include: {
        category: true,
      }
    });

    return NextResponse.json({
      success: true,
      article: newArticle,
      newsSourcesUsed: newsContext.sourcesResponded,
      totalNewsFetched: newsContext.totalFetched,
    }, { status: 201 });
  } catch (error) {
    console.error("Error generating article:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}