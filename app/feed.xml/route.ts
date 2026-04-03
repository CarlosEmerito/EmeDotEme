import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { siteConfig } from '@/config/site';
import RSS from 'rss';

export async function GET() {
  const feed = new RSS({
    title: siteConfig.name,
    description: siteConfig.description,
    feed_url: `${siteConfig.url}/feed.xml`,
    site_url: siteConfig.url,
    image_url: `${siteConfig.url}/logo.png`,
    managingEditor: siteConfig.author,
    webMaster: siteConfig.author,
    copyright: `${new Date().getFullYear()} ${siteConfig.name}`,
    language: 'es',
    pubDate: new Date().toUTCString(),
    ttl: 60,
  });

  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { category: true }
  });

  articles.forEach((article) => {
    feed.item({
      title: article.title,
      description: article.summary || '',
      url: `${siteConfig.url}/articulo/${article.slug}`,
      guid: article.id,
      categories: [article.category.name],
      author: article.author,
      date: article.createdAt,
    });
  });

  return new NextResponse(feed.xml({ indent: true }), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
