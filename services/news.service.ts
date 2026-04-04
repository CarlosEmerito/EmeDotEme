import Parser from "rss-parser";

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
    // Fuentes Cripto (A fondo en el ecosistema)
    { url: "https://cointelegraph.com/rss", name: "Cointelegraph" },
    { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", name: "CoinDesk" },
    { url: "https://cryptopotato.com/feed/", name: "CryptoPotato" },
    { url: "https://www.newsbtc.com/feed/", name: "NewsBTC" }
  ];

  let allNews: NewsItem[] = [];

  // Peticiones en paralelo a todas las fuentes de noticias
  const fetchPromises = feeds.map(async (feed) => {
    try {
      const parsed = await parser.parseURL(feed.url);
      
      // Tomamos solo las 10 noticias más recientes de cada fuente
      const items = parsed.items.slice(0, 10).map((item: any) => {
        // Intentar extraer la URL de la imagen (distintos formatos según el feed)
        let imageUrl: string | undefined = undefined;
        
        if (item.enclosure && item.enclosure.url) {
          imageUrl = item.enclosure.url;
        } else if (item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url) {
          imageUrl = item['media:content']['$'].url;
        }

        // Si no se encontró, extraemos del HTML
        if (!imageUrl && (item['content:encoded'] || item.content)) {
          const contentStr = item['content:encoded'] || item.content || '';
          const match = contentStr.match(/<img[^>]+src="([^">]+)"/i);
          if (match && match[1]) {
            imageUrl = match[1];
          }
        }

        // Filtrar imágenes basura o patrocinadas para que se usen las de Unsplash por defecto
        if (imageUrl) {
          const lowerUrl = imageUrl.toLowerCase();
          // Ignoramos imágenes que puedan ser genéricas de feeds generales (como barcos o cosas no cripto)
          // Forzando mejor un fallback image temático si no estamos seguros.
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
  
  // Juntamos todos los resultados en un solo array
  results.forEach(items => {
    allNews = [...allNews, ...items];
  });

  // Ordenamos todas las noticias de más nuevas a más antiguas
  allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  // Devolvemos el top 40 de noticias más recientes de todo el mundo
  return allNews.slice(0, 40);
}