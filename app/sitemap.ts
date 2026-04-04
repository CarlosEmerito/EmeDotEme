import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { siteConfig } from '@/config/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await prisma.article.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true, titleEn: true },
    orderBy: { createdAt: 'desc' }
  });

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteConfig.url}/articulo/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: 'never',
    priority: 0.8,
  }));

  const articleEntriesEn: MetadataRoute.Sitemap = articles
    .filter(article => article.titleEn)
    .map((article) => ({
      url: `${siteConfig.url}/en/articulo/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: 'never',
      priority: 0.7,
    }));

  const categories = await prisma.category.findMany({
    select: { slug: true, updatedAt: true }
  });

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteConfig.url}/categoria/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${siteConfig.url}/noticias`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/sobre-mi`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  return [...staticEntries, ...categoryEntries, ...articleEntries, ...articleEntriesEn];
}
