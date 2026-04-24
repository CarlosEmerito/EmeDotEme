import 'dotenv/config';
import Parser from 'rss-parser';
import * as Clustering from './clustering';

// ============================================================
// TIPOS
// ============================================================

export interface NewsSource {
  name: string;
  slug: string;
  url: string;
  language: 'en' | 'es';
  reliability: 'high' | 'medium';
  enabled: boolean;
}

export interface NewsItem {
  title: string;
  description: string;
  link: string;
  source: string;
  sourceSlug: string;
  pubDate: Date;
  categories: string[];
  author?: string;
  imageUrl?: string;
}

// ============================================================
// FUENTES CONFIGURADAS
// ============================================================

export const NEWS_SOURCES: NewsSource[] = [
  { name: 'The Hacker News', slug: 'the-hacker-news', url: 'https://feeds.feedburner.com/TheHackersNews', language: 'en', reliability: 'high', enabled: true },
  { name: 'Krebs on Security', slug: 'krebs-on-security', url: 'https://krebsonsecurity.com/feed/', language: 'en', reliability: 'high', enabled: true },
  { name: 'Security Affairs', slug: 'security-affairs', url: 'https://securityaffairs.com/feed', language: 'en', reliability: 'medium', enabled: true },
  { name: 'CoinDesk', slug: 'coindesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', language: 'en', reliability: 'high', enabled: true },
  { name: 'MIT Technology Review AI', slug: 'mit-ai', url: 'https://www.technologyreview.com/feed/', language: 'en', reliability: 'high', enabled: true },
  { name: 'Decrypt', slug: 'decrypt', url: 'https://decrypt.co/feed', language: 'en', reliability: 'high', enabled: true },
  { name: 'VentureBeat AI', slug: 'venturebeat-ai', url: 'https://venturebeat.com/category/ai/feed/', language: 'en', reliability: 'high', enabled: true },
  { name: 'El País Tecnología', slug: 'elpais-tecnologia', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/tecnologia/portada', language: 'es', reliability: 'medium', enabled: true },
];

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'EmeDotEme/1.0 NewsAggregator',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [['dc:creator', 'creator'], ['media:content', 'mediaContent'], ['media:thumbnail', 'mediaThumbnail']],
  },
});

async function fetchFromSource(source: NewsSource): Promise<NewsItem[]> {
  try {
    console.log(`📡 Fetching: ${source.name}...`);
    const feed = await parser.parseURL(source.url);

    return (feed.items || [])
      .filter((item) => item.title && item.link)
      .map((item) => {
        let imageUrl: string | undefined;
        const mediaContent = (item as any).mediaContent;
        const mediaThumbnail = (item as any).mediaThumbnail;
        const enclosure = item.enclosure;

        if (mediaContent?.$.url) imageUrl = mediaContent.$.url;
        else if (mediaThumbnail?.$.url) imageUrl = mediaThumbnail.$.url;
        else if (enclosure?.url) imageUrl = enclosure.url;

        if (source.slug === 'decrypt') imageUrl = undefined;

        const categories: string[] = [];
        if (item.categories) {
          for (const cat of item.categories) {
            if (typeof cat === 'string') categories.push(cat.trim());
            else if (typeof cat === 'object' && (cat as any)._) categories.push((cat as any)._.trim());
          }
        }

        return {
          title: item.title!.trim(),
          description: (item.contentSnippet || item.content || item.summary || '').trim(),
          link: item.link!,
          source: source.name,
          sourceSlug: source.slug,
          pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          categories,
          author: (item as any).creator || item.creator || undefined,
          imageUrl,
        };
      })
      .filter((item) => {
        const hoursAgo = (Date.now() - item.pubDate.getTime()) / (1000 * 60 * 60);
        return hoursAgo <= 48;
      });
  } catch (error) {
    return [];
  }
}

export interface FetchedNewsContext {
  newsItems: NewsItem[];
  topicClusters: NewsItem[][];
  totalFetched: number;
  sourcesResponded: string[];
}

export async function fetchLatestNews(
  recentTitles: string[] = [],
  recentSourceUrls: string[] = [],
  maxNewsPerSource: number = 10
): Promise<FetchedNewsContext> {
  const enabledSources = NEWS_SOURCES.filter((s) => s.enabled);
  const results = await Promise.allSettled(enabledSources.map((source) => fetchFromSource(source)));

  const allNews: NewsItem[] = [];
  const sourcesResponded: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allNews.push(...result.value.slice(0, maxNewsPerSource));
      sourcesResponded.push(enabledSources[index].name);
    }
  });

  if (allNews.length === 0) {
    return { newsItems: [], topicClusters: [], totalFetched: 0, sourcesResponded: [] };
  }

  const reliabilityMap: Record<string, number> = {};
  NEWS_SOURCES.forEach(s => reliabilityMap[s.name] = s.reliability === 'high' ? 2 : 1);

  const deduplicated = Clustering.deduplicateNews(allNews, reliabilityMap);
  const fresh = Clustering.filterAlreadyCovered(deduplicated, recentTitles, recentSourceUrls);
  const topicClusters = Clustering.clusterByTopic(fresh, 5);

  const bestCluster = topicClusters.sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    return b[0].pubDate.getTime() - a[0].pubDate.getTime();
  })[0] || [];

  return {
    newsItems: bestCluster,
    topicClusters,
    totalFetched: allNews.length,
    sourcesResponded,
  };
}

export function formatNewsForPrompt(newsItems: NewsItem[]): string {
  if (newsItems.length === 0) return '';
  return newsItems.map((item, i) => `
--- Noticia ${i + 1} (${item.source}) ---
Título: ${item.title}
Resumen: ${item.description.substring(0, 300)}...
URL: ${item.link}
Fecha: ${item.pubDate.toISOString()}
`).join('\n');
}
