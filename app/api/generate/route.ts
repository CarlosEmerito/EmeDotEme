import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { generateBilingualContent } from "@/modules/ai/ai.service";
import { fetchLatestNews } from "@/modules/news/news-sources.service";
import { generateSlug } from "@/lib/utils";
import { FALLBACK_IMAGES } from "@/config/constants";

export const maxDuration = 300; // Allow up to 5 minutes for AI generation + RSS fetch

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 1. Asegurar que existan categorías base
    const categories = ["Criptomonedas", "IA", "Mercados", "Tecnología", "Ciberseguridad"];
    
    await Promise.all(
      categories.map(name =>
        prisma.category.upsert({
          where: { name },
          update: {},
          create: {
            name,
            slug: generateSlug(name, false),
          },
        })
      )
    );

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
    const aiResponse = await generateBilingualContent(recentTitles, newsContext.newsItems);
    
    const slug = generateSlug(aiResponse.title, false);

    let imageUrl = aiResponse.sourceImageUrl;
    if (!imageUrl) {
      const options = FALLBACK_IMAGES[randomCategory.name] || FALLBACK_IMAGES["Mercados"];
      imageUrl = options[Math.floor(Math.random() * options.length)];
    }

    // 4. Guardar el artículo generado con fuentes
    const hasRealSources = newsContext.newsItems.length > 0;
    const tagsArray = aiResponse.tags || [];
    const newArticle = await prisma.article.create({
      data: {
        title: aiResponse.title,
        titleEn: aiResponse.titleEn,
        slug: slug + '-' + Date.now(),
        summary: aiResponse.summary,
        summaryEn: aiResponse.summaryEn,
        content: aiResponse.content,
        contentEn: aiResponse.contentEn,
        imageUrl: imageUrl,
        imageCaption: aiResponse.imageCaption,
        sourceUrl: aiResponse.sourceUrl || null,
        categoryId: randomCategory.id,
        author: siteConfig.author,
        published: true,
        publishedAt: new Date(),
        isOriginal: !hasRealSources, // false si se basa en fuentes externas
        articleTags: {
          connectOrCreate: tagsArray.map((tag: string) => ({
            where: { name: tag },
            create: { 
              name: tag, 
              slug: tag.toLowerCase().replace(/\s+/g, '-') 
            }
          }))
        },
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