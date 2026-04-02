import { prisma } from "@/lib/prisma";

/**
 * Recupera los artículos publicados ordenados por fecha de creación (más recientes primero).
 * @param limit Número máximo de artículos a recuperar.
 */
export async function getPublishedArticles(limit: number = 5) {
  return await prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: { category: true },
    take: limit,
  });
}

/**
 * Recupera un artículo específico por su slug (URL amigable).
 * @param slug El slug del artículo a buscar.
 */
export async function getArticleBySlug(slug: string) {
  return await prisma.article.findUnique({
    where: { slug },
    include: { category: true },
  });
}
