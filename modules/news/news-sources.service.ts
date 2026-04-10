import 'dotenv/config';
import Parser from 'rss-parser';

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
  source: string;       // nombre de la fuente (CoinDesk, etc.)
  sourceSlug: string;    // slug para uso interno
  pubDate: Date;
  categories: string[];
  author?: string;
  imageUrl?: string;
}

// ============================================================
// FUENTES CONFIGURADAS
// ============================================================

export const NEWS_SOURCES: NewsSource[] = [
    // === FUENTES DE CIBERSEGURIDAD ===
    {
      name: 'The Hacker News',
      slug: 'the-hacker-news',
      url: 'https://feeds.feedburner.com/TheHackersNews',
      language: 'en',
      reliability: 'high',
      enabled: true,
    },
    {
      name: 'Krebs on Security',
      slug: 'krebs-on-security',
      url: 'https://krebsonsecurity.com/feed/',
      language: 'en',
      reliability: 'high',
      enabled: true,
    },
    {
      name: 'Security Affairs',
      slug: 'security-affairs',
      url: 'https://securityaffairs.com/feed',
      language: 'en',
      reliability: 'medium',
      enabled: true,
    },
  // Para añadir una nueva categoría visible en la web, recuerda crearla en la base de datos y añadirla al menú si aplica.
  {
    name: 'CoinDesk',
    slug: 'coindesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    language: 'en',
    reliability: 'high',
    enabled: true,
  },
  // Fuente funcional de MIT Technology Review AI
  {
    name: 'MIT Technology Review AI',
    slug: 'mit-ai',
    url: 'https://www.technologyreview.com/feed/',
    language: 'en',
    reliability: 'high',
    enabled: true,
  },
  {
    name: 'Decrypt',
    slug: 'decrypt',
    url: 'https://decrypt.co/feed',
    language: 'en',
    reliability: 'high',
    enabled: true,
  },
    // --- Puedes añadir nuevas categorías aquí ---
    // Ejemplo:
    // {
    //   name: 'Nueva Categoría',
    //   slug: 'nueva-categoria',
    //   url: 'https://ejemplo.com/rss',
    //   language: 'es',
    //   reliability: 'medium',
    //   enabled: true,
    // },
  // === FUENTES DE INTELIGENCIA ARTIFICIAL ===
  {
    name: 'VentureBeat AI',
    slug: 'venturebeat-ai',
    url: 'https://venturebeat.com/category/ai/feed/',
    language: 'en',
    reliability: 'high',
    enabled: true,
  },
  // (Eliminado duplicado de MIT Technology Review AI)
  {
    name: 'El País Tecnología',
    slug: 'elpais-tecnologia',
    url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/tecnologia/portada',
    language: 'es',
    reliability: 'medium',
    enabled: true,
  },
];

// ============================================================
// RSS PARSER
// ============================================================

const parser = new Parser({
  timeout: 15000, // 15 segundos timeout
  headers: {
    'User-Agent': 'EmeDotEme/1.0 NewsAggregator',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['dc:creator', 'creator'],
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
    ],
  },
});

/**
 * Fetch noticias de una sola fuente RSS.
 * Retorna un array vacío si falla (no lanza excepciones).
 */
async function fetchFromSource(source: NewsSource): Promise<NewsItem[]> {
  try {
    console.log(`📡 Fetching noticias de ${source.name}...`);
    const feed = await parser.parseURL(source.url);

    if (!feed.items || feed.items.length === 0) {
      console.warn(`⚠️ ${source.name} no devolvió items`);
      return [];
    }

    const items: NewsItem[] = feed.items
      .filter((item) => item.title && item.link)
      .map((item) => {
        // Extraer imagen de varias fuentes posibles
        let imageUrl: string | undefined;
        const mediaContent = (item as any).mediaContent;
        const mediaThumbnail = (item as any).mediaThumbnail;
        const enclosure = item.enclosure;

        if (mediaContent?.$.url) {
          imageUrl = mediaContent.$.url;
        } else if (mediaThumbnail?.$.url) {
          imageUrl = mediaThumbnail.$.url;
        } else if (enclosure?.url) {
          imageUrl = enclosure.url;
        }

        // Extraer categorías
        const categories: string[] = [];
        if (item.categories) {
          for (const cat of item.categories) {
            if (typeof cat === 'string' && cat.trim()) {
              categories.push(cat.trim());
            } else if (typeof cat === 'object' && (cat as any)._ ) {
              categories.push((cat as any)._.trim());
            }
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
      // Solo noticias de las últimas 48 horas
      .filter((item) => {
        const hoursAgo = (Date.now() - item.pubDate.getTime()) / (1000 * 60 * 60);
        return hoursAgo <= 48;
      });

    console.log(`✅ ${source.name}: ${items.length} noticias recientes (últimas 48h)`);
    return items;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error fetching ${source.name}: ${msg}`);
    return [];
  }
}

// ============================================================
// DEDUPLICACIÓN
// ============================================================

/**
 * Calcula similitud simple entre dos títulos (Jaccard sobre palabras).
 * Retorna un valor entre 0 y 1.
 */
function titleSimilarity(a: string, b: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-záéíóúñü0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2); // Ignorar palabras cortas

  const wordsA = new Set(normalize(a));
  const wordsB = new Set(normalize(b));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection++;
  }

  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

/**
 * Deduplica noticias que sean muy similares entre fuentes.
 * Prioriza la fuente con mayor fiabilidad y más reciente.
 */
function deduplicateNews(items: NewsItem[]): NewsItem[] {
  const deduplicated: NewsItem[] = [];

  const reliabilityOrder: Record<string, number> = {};
  for (const source of NEWS_SOURCES) {
    reliabilityOrder[source.name] = source.reliability === 'high' ? 2 : 1;
  }

  // Ordenar por fecha (más recientes primero) y luego por fiabilidad
  const sorted = [...items].sort((a, b) => {
    const dateCompare = b.pubDate.getTime() - a.pubDate.getTime();
    if (dateCompare !== 0) return dateCompare;
    return (reliabilityOrder[b.source] || 0) - (reliabilityOrder[a.source] || 0);
  });

  for (const item of sorted) {
    const isDuplicate = deduplicated.some(
      (existing) => titleSimilarity(existing.title, item.title) > 0.5
    );
    if (!isDuplicate) {
      deduplicated.push(item);
    }
  }

  return deduplicated;
}

// ============================================================
// SELECCIÓN DE NOTICIAS PARA GENERAR ARTÍCULOS
// ============================================================

/**
 * Filtra noticias que ya se cubrieron (comparando con títulos recientes de la BD).
 */
function filterAlreadyCovered(
  news: NewsItem[],
  recentTitles: string[],
  recentSourceUrls: string[]
): NewsItem[] {
  if (recentTitles.length === 0 && recentSourceUrls.length === 0) return news;

  return news.filter((item) => {
    // 1. Precise check: Exact URL match
    if (item.link && recentSourceUrls.includes(item.link)) {
      console.log(`  🔄 Saltando (URL ya cubierta): "${item.link}"`);
      return false;
    }

    // 2. Fallback check: Title similarity
    const isCovered = recentTitles.some(
      (recentTitle) => titleSimilarity(item.title, recentTitle) > 0.4
    );
    if (isCovered) {
      console.log(`  🔄 Saltando (título ya cubierto): "${item.title.substring(0, 60)}..."`);
    }
    return !isCovered;
  });
}

/**
 * Agrupa noticias por tema común para generar artículos más completos.
 * Retorna clusters de noticias relacionadas.
 */
function clusterByTopic(news: NewsItem[], maxClusters: number = 3): NewsItem[][] {
  if (news.length === 0) return [];

  const used = new Set<number>();
  const clusters: NewsItem[][] = [];

  for (let i = 0; i < news.length && clusters.length < maxClusters; i++) {
    if (used.has(i)) continue;

    const cluster: NewsItem[] = [news[i]];
    used.add(i);

    // Buscar noticias relacionadas
    for (let j = i + 1; j < news.length; j++) {
      if (used.has(j)) continue;
      // Similitud más baja para agrupar temas relacionados
      if (titleSimilarity(news[i].title, news[j].title) > 0.25) {
        cluster.push(news[j]);
        used.add(j);
        if (cluster.length >= 4) break; // Máximo 4 fuentes por cluster
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

// ============================================================
// FUNCIÓN PRINCIPAL
// ============================================================

export interface FetchedNewsContext {
  /** Noticias seleccionadas como contexto para la generación */
  newsItems: NewsItem[];
  /** Todas las noticias agrupadas por tema */
  topicClusters: NewsItem[][];
  /** Total de noticias fetched antes de filtrar */
  totalFetched: number;
  /** Fuentes que respondieron correctamente */
  sourcesResponded: string[];
}

/**
 * Fetch las últimas noticias de todas las fuentes habilitadas,
 * las deduplica, filtra las ya cubiertas, y las agrupa por tema.
 *
 * @param recentTitles Títulos de artículos recientes para evitar repetición
 * @param maxNewsPerSource Máximo de noticias por fuente (default: 10)
 */
export async function fetchLatestNews(
  recentTitles: string[] = [],
  recentSourceUrls: string[] = [],
  maxNewsPerSource: number = 10
): Promise<FetchedNewsContext> {
  console.log('\n📰 ═══════════════════════════════════════════════════════');
  console.log('📰 FETCHING NOTICIAS DE FUENTES FIABLES');
  console.log('📰 ═══════════════════════════════════════════════════════\n');

  const enabledSources = NEWS_SOURCES.filter((s) => s.enabled);
  console.log(`📡 Fuentes habilitadas: ${enabledSources.map((s) => s.name).join(', ')}`);

  // Fetch en paralelo de todas las fuentes
  const results = await Promise.allSettled(
    enabledSources.map((source) => fetchFromSource(source))
  );

  const allNews: NewsItem[] = [];
  const sourcesResponded: string[] = [];

  results.forEach((result, index) => {
    const source = enabledSources[index];
    if (result.status === 'fulfilled' && result.value.length > 0) {
      // Limitar por fuente
      allNews.push(...result.value.slice(0, maxNewsPerSource));
      sourcesResponded.push(source.name);
    } else if (result.status === 'rejected') {
      console.error(`❌ ${source.name} rechazado: ${result.reason}`);
    }
  });

  const totalFetched = allNews.length;
  console.log(`\n📊 Total noticias fetched: ${totalFetched}`);
  console.log(`📊 Fuentes que respondieron: ${sourcesResponded.join(', ') || 'Ninguna'}`);

  if (allNews.length === 0) {
    console.warn('⚠️ No se obtuvo ninguna noticia de ninguna fuente');
    return {
      newsItems: [],
      topicClusters: [],
      totalFetched: 0,
      sourcesResponded: [],
    };
  }

  // Deduplicar
  const deduplicated = deduplicateNews(allNews);
  console.log(`📊 Tras deduplicar: ${deduplicated.length} noticias únicas`);

  // Filtrar ya cubiertas
  const fresh = filterAlreadyCovered(deduplicated, recentTitles, recentSourceUrls);
  console.log(`📊 Tras filtrar cubiertas: ${fresh.length} noticias nuevas`);

  // Agrupar por tema
  const topicClusters = clusterByTopic(fresh, 5);
  console.log(`📊 Clusters de temas: ${topicClusters.length}`);
  topicClusters.forEach((cluster, idx) => {
    console.log(`  📌 Cluster ${idx + 1}: "${cluster[0].title.substring(0, 60)}..." (${cluster.length} fuentes)`);
  });

  // Seleccionar las noticias del cluster más nutrido o más reciente
  const bestCluster = topicClusters.sort((a, b) => {
    // Priorizar clusters con más fuentes
    if (b.length !== a.length) return b.length - a.length;
    // Si iguales, el más reciente
    return b[0].pubDate.getTime() - a[0].pubDate.getTime();
  })[0] || [];

  console.log(`\n🎯 Cluster seleccionado: "${bestCluster[0]?.title.substring(0, 60)}..." con ${bestCluster.length} fuente(s)`);
  console.log('📰 ═══════════════════════════════════════════════════════\n');

  return {
    newsItems: bestCluster,
    topicClusters,
    totalFetched,
    sourcesResponded,
  };
}

/**
 * Formatea las noticias como contexto legible para el prompt de IA.
 */
export function formatNewsForPrompt(newsItems: NewsItem[]): string {
  if (newsItems.length === 0) return '';

  const lines: string[] = [
    '=== NOTICIAS REALES DE FUENTES VERIFICADAS ===',
    `Total de fuentes consultadas: ${new Set(newsItems.map((n) => n.source)).size}`,
    '',
  ];

  for (let i = 0; i < newsItems.length; i++) {
    const item = newsItems[i];
    lines.push(`--- Noticia ${i + 1} (${item.source}) ---`);
    lines.push(`Título: ${item.title}`);
    if (item.description) {
      // Limitar descripción a 300 chars para ahorrar tokens
      const desc = item.description.substring(0, 300);
      lines.push(`Resumen: ${desc}${item.description.length > 300 ? '...' : ''}`);
    }
    lines.push(`URL: ${item.link}`);
    lines.push(`Fecha: ${item.pubDate.toISOString()}`);
    if (item.categories.length > 0) {
      lines.push(`Categorías: ${item.categories.join(', ')}`);
    }
    if (item.author) {
      lines.push(`Autor original: ${item.author}`);
    }
    lines.push('');
  }

  lines.push('=== FIN DE NOTICIAS ===');
  return lines.join('\n');
}
