import Parser from "rss-parser";

const parser = new Parser();

export interface NewsItem {
  title: string;
  source: string;
  pubDate: string;
  link: string;
}

/**
 * Obtiene las últimas noticias desde varias fuentes en tiempo real.
 * No usamos caché a petición, para que siempre esté fresco.
 */
export async function getLatestNews(): Promise<NewsItem[]> {
  const feeds = [
    // Fuentes Cripto (A fondo en el ecosistema)
    { url: "https://cointelegraph.com/rss", name: "Cointelegraph" },
    { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", name: "CoinDesk" },
    // Fuente de Economía / Regulación Global
    { url: "https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml", name: "Wall Street Journal (Business)" },
    { url: "https://www.cnbc.com/id/10000664/device/rss/rss.html", name: "CNBC Finance" }
  ];

  let allNews: NewsItem[] = [];

  // Peticiones en paralelo a todas las fuentes de noticias
  const fetchPromises = feeds.map(async (feed) => {
    try {
      const parsed = await parser.parseURL(feed.url);
      
      // Tomamos solo las 10 noticias más recientes de cada fuente
      const items = parsed.items.slice(0, 10).map(item => ({
        title: item.title || "Noticia sin título",
        source: feed.name,
        pubDate: item.isoDate || item.pubDate || new Date().toISOString(),
        link: item.link || ""
      }));
      
      return items;
    } catch (error) {
      console.error(`⚠️ Error obteniendo noticias de ${feed.name}:`, error);
      return [];
    }
  });

  const results = await Promise.all(fetchPromises);
  
  // Juntamos todos los resultados en un solo array
  results.forEach(items => {
    allNews = [...allNews, ...items];
  });

  // Ordenamos todas las noticias de más nuevas a más antiguas
  allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  // Devolvemos el top 40 de noticias más recientes de todo el mundo
  return allNews.slice(0, 40);
}