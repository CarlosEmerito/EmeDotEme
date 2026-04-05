import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Recupera los artículos publicados ordenados por fecha de creación (más recientes primero).
 * @param limit Número máximo de artículos a recuperar.
 */
export async function getPublishedArticles(limit: number = 5, skip: number = 0) {
  return await prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: { category: true },
    take: limit,
    skip: skip,
  });
}

export async function getTotalPublishedArticlesCount() {
  return await prisma.article.count({
    where: { published: true },
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
export async function getArticlesByCategorySlug(slug: string, limit: number = 10, skip: number = 0) {
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
    skip: skip,
  });
}

export async function getTotalArticlesByCategorySlug(slug: string) {
  return await prisma.article.count({
    where: {
      published: true,
      category: {
        slug: slug
      }
    }
  });
}

export interface SearchOptions {
  query?: string;
  language?: 'es' | 'en';
  categoryId?: string;
  categorySlug?: string;
  tags?: string[];
  sentiment?: string;
  dateFrom?: Date;
  dateTo?: Date;
  publishedOnly?: boolean;
  sortBy?: 'relevance' | 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

export async function searchArticles(options: SearchOptions = {}) {
  const {
    query = '',
    language = 'es',
    categoryId,
    categorySlug,
    tags = [],
    sentiment,
    dateFrom,
    dateTo,
    publishedOnly = true,
    sortBy = 'newest',
    page = 1,
    limit = 10
  } = options;

  const skip = (page - 1) * limit;
  const where: Prisma.ArticleWhereInput = {};

  if (publishedOnly) {
    where.published = true;
  }

  if (query.trim()) {
    const searchConditions = [];
    const searchQuery = query.trim();
    if (language === 'es') {
      searchConditions.push(
        { title: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
        { content: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
        { summary: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } }
      );
    } else if (language === 'en') {
      searchConditions.push(
        { titleEn: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
        { contentEn: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
        { summaryEn: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } }
      );
    } else {
      searchConditions.push(
        { title: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
        { content: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
        { summary: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
        { titleEn: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
        { contentEn: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
        { summaryEn: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } }
      );
    }
    where.OR = searchConditions;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (categorySlug) {
    where.category = {
      slug: categorySlug
    };
  }

  if (tags.length > 0) {
    where.tags = {
      hasSome: tags
    };
  }

  if (sentiment) {
    where.sentiment = sentiment;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      where.createdAt.gte = dateFrom;
    }
    if (dateTo) {
      where.createdAt.lte = dateTo;
    }
  }

  let orderBy: Prisma.ArticleOrderByWithRelationInput = {};
  switch (sortBy) {
    case 'relevance':
      orderBy = { createdAt: 'desc' };
      break;
    case 'oldest':
      orderBy = { createdAt: 'asc' };
      break;
    case 'newest':
    default:
      orderBy = { createdAt: 'desc' };
      break;
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy,
      include: { category: true },
      skip,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  return {
    articles,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: page < Math.ceil(total / limit),
  };
}

export async function simpleSearchArticles(query: string, limit: number = 10) {
  const result = await searchArticles({ query, limit });
  return result.articles;
}

export async function getAllCategories() {
  return await prisma.category.findMany({
    orderBy: { name: "asc" }
  });
}

export async function getCategoryBySlug(slug: string) {
  return await prisma.category.findUnique({
    where: { slug }
  });
}
