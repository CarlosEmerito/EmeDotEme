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

/**
 * Recupera artículos relacionados basados en la categoría, excluyendo el actual.
 * @param categoryId ID de la categoría
 * @param currentArticleId ID del artículo que se está viendo
 * @param limit Límite de resultados
 */
export async function getRelatedArticles(categoryId: string, currentArticleId: string, limit: number = 3) {
  return await prisma.article.findMany({
    where: {
      published: true,
      categoryId,
      id: { not: currentArticleId }
    },
    orderBy: { createdAt: "desc" },
    include: { category: true },
    take: limit,
  });
}

/**
 * Recupera artículos por el slug de su categoría
 * @param slug Slug de la categoría
 */
export async function getArticlesByCategorySlug(slug: string, limit: number = 10) {
  return await prisma.article.findMany({
    where: {
      published: true,
      category: {
        slug: slug
      }
    },
    orderBy: { createdAt: "desc" },
    include: { category: true },
    take: limit,
  });
}

/**
 * Busca artículos por término de búsqueda (título o contenido)
 * @param query Término de búsqueda
 */
export async function searchArticles(query: string, limit: number = 10) {
  return await prisma.article.findMany({
    where: {
      published: true,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
        { summary: { contains: query, mode: "insensitive" } }
      ]
    },
    orderBy: { createdAt: "desc" },
    include: { category: true },
    take: limit,
  });
}
export async function getAllCategories() {
  return await prisma.category.findMany({
    orderBy: { name: "asc" }
  });
}

/**
 * Recupera una categoría por su slug
 * @param slug Slug de la categoría
 */
export async function getCategoryBySlug(slug: string) {
  return await prisma.category.findUnique({
    where: { slug }
  });
}
