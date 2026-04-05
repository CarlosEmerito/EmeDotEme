import Parser from "rss-parser";

interface RssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  enclosure?: { url?: string };
  "media:content"?: { $?: { url?: string } };
  content?: string;
  "content:encoded"?: string;
  contentEncoded?: string;
}

const parser = new Parser({
  customFields: {
    item: ['media:content', 'enclosure', 'content:encoded', 'content'],
  }
});

export interface NewsItem {
  title: string;
  source: string;
  pubDate: string;
  link: string;
  imageUrl?: string;
}

/**
 * Obtiene las últimas noticias desde varias fuentes en tiempo real.
 * No usamos caché a petición, para que siempre esté fresco.
 */
export async function getLatestNews(): Promise<NewsItem[]> {
  const feeds = [
    { url: "https://cointelegraph.com/rss", name: "Cointelegraph" },
    { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", name: "CoinDesk" },
    { url: "https://cryptopotato.com/feed/", name: "CryptoPotato" },
    { url: "https://www.newsbtc.com/feed/", name: "NewsBTC" }
  ];

  let allNews: NewsItem[] = [];

  const fetchPromises = feeds.map(async (feed) => {
    try {
      const parsed = await parser.parseURL(feed.url);
      const items = parsed.items.slice(0, 10).map((item: RssItem) => {
        let imageUrl: string | undefined = undefined;
        if (item.enclosure && item.enclosure.url) {
          imageUrl = item.enclosure.url;
        } else if (item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url) {
          imageUrl = item['media:content']['$'].url;
        }
        if (!imageUrl && (item['content:encoded'] || item.content)) {
          const contentStr = item['content:encoded'] || item.content || '';
          const match = contentStr.match(/<img[^>]+src="([^">]+)"/i);
          if (match && match[1]) {
            imageUrl = match[1];
          }
        }
        if (imageUrl) {
          const lowerUrl = imageUrl.toLowerCase();
          if (lowerUrl.includes('sponsored') || lowerUrl.includes('banner') || lowerUrl.includes('ad-') || lowerUrl.includes('logo') || lowerUrl.includes('placeholder')) {
            imageUrl = undefined;
          }
        }
        return {
          title: item.title || "Noticia sin título",
          source: feed.name,
          pubDate: item.isoDate || item.pubDate || new Date().toISOString(),
          link: item.link || "",
          imageUrl
        };
      });
      return items;
    } catch (error) {
      console.error(`⚠️ Error obteniendo noticias de ${feed.name}:`, error);
      return [];
    }
  });

  const results = await Promise.all(fetchPromises);
  results.forEach(items => {
    allNews = [...allNews, ...items];
  });
  allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return allNews.slice(0, 40);
}
