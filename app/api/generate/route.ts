import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
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

    // 2. Aquí iría la llamada real al LLM (OpenAI, Anthropic, Gemini)
    // Para esta fase, simularemos la respuesta de la IA para poblar la DB.
    
    const titles = [
      "Bitcoin rompe la barrera de los $100K: Análisis del mercado",
      "Ethereum lanza una nueva propuesta de mejora (EIP)",
      "Solana procesa un millón de transacciones por segundo en pruebas",
      "Nuevo marco regulatorio en la Unión Europea para criptoactivos",
      "La adopción institucional de DeFi alcanza máximos históricos"
    ];
    
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const slug = randomTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // 3. Guardar el artículo "generado" en la base de datos
    const newArticle = await prisma.article.create({
      data: {
        title: randomTitle,
        slug: slug + '-' + Date.now(), // Para evitar duplicados en la demo
        summary: "La inteligencia artificial de EmeDotEme ha analizado los últimos movimientos del mercado y reporta hallazgos significativos en este sector.",
        content: "<p>Este es el contenido completo del artículo generado automáticamente. En un entorno de producción, este texto extenso sería redactado por un LLM tras analizar fuentes de datos en tiempo real.</p><p>Analizamos las tendencias, el volumen de operaciones y el sentimiento general del mercado para brindarte esta información de vanguardia.</p>",
        categoryId: randomCategory.id,
        author: "EmeDotEme AI",
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