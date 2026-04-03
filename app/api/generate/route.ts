import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { generateArticleContent } from "@/services/ai.service";

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

    // 2. Llamada al servicio de IA
    const aiResponse = await generateArticleContent();
    
    const slug = aiResponse.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // 3. Guardar el artículo generado en la base de datos
    const newArticle = await prisma.article.create({
      data: {
        title: aiResponse.title,
        slug: slug + '-' + Date.now(), // Para evitar duplicados en la demo
        summary: aiResponse.summary,
        content: aiResponse.content,
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