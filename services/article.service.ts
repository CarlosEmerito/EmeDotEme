import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function createArticle(article: GeneratedArticle): Promise<void> {
  await prisma.article.create({
    data: {
      title: article.title,
      summary: article.summary,
      content: article.content,
      tags: article.tags || [],
      sourceImageUrl: article.sourceImageUrl,
      imageCaption: article.imageCaption,
      sourceUrl: article.sourceUrl,
      sentiment: article.sentiment,
      titleEn: article.titleEn,
      summaryEn: article.summaryEn,
      contentEn: article.contentEn,
      imageUrl: article.imagePrompt, // Assuming imagePrompt is used for imageUrl
    },
  });
}

// Otros métodos para interactuar con la base de datos...
