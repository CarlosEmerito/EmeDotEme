import { NewsItem } from './news-sources.service';

/**
 * ClusteringEngine: Lógica pura para deduplicación y agrupación de noticias.
 */

// Cache para evitar normalizar y crear Sets repetidamente
const titleCache = new Map<string, Set<string>>();

/**
 * Normaliza un título a un Set de palabras relevantes.
 */
export function getNormalizedWords(s: string): Set<string> {
  let words = titleCache.get(s);
  if (words) return words;

  if (titleCache.size >= 1000) {
    const firstKey = titleCache.keys().next().value;
    if (firstKey !== undefined) titleCache.delete(firstKey);
  }

  words = new Set(
    s
      .toLowerCase()
      .replace(/[^a-záéíóúñü0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
  titleCache.set(s, words);
  return words;
}

/**
 * Calcula similitud simple entre dos títulos (Jaccard sobre palabras).
 * Retorna un valor entre 0 y 1.
 */
export function titleSimilarity(a: string, b: string): number {
  const wordsA = getNormalizedWords(a);
  const wordsB = getNormalizedWords(b);

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  const [smaller, larger] = wordsA.size < wordsB.size ? [wordsA, wordsB] : [wordsB, wordsA];

  for (const word of smaller) {
    if (larger.has(word)) intersection++;
  }

  const union = wordsA.size + wordsB.size - intersection;
  return intersection / union;
}

/**
 * Deduplica noticias que sean muy similares entre fuentes.
 */
export function deduplicateNews(items: NewsItem[], reliabilityMap: Record<string, number>): NewsItem[] {
  const deduplicated: NewsItem[] = [];

  const sorted = [...items].sort((a, b) => {
    const dateCompare = b.pubDate.getTime() - a.pubDate.getTime();
    if (dateCompare !== 0) return dateCompare;
    return (reliabilityMap[b.source] || 0) - (reliabilityMap[a.source] || 0);
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

/**
 * Filtra noticias que ya se cubrieron (comparando con títulos recientes de la BD).
 */
export function filterAlreadyCovered(
  news: NewsItem[],
  recentTitles: string[],
  recentSourceUrls: string[]
): NewsItem[] {
  if (recentTitles.length === 0 && recentSourceUrls.length === 0) return news;

  return news.filter((item) => {
    if (item.link && recentSourceUrls.includes(item.link)) {
      return false;
    }

    const isCovered = recentTitles.some(
      (recentTitle) => titleSimilarity(item.title, recentTitle) > 0.4
    );
    return !isCovered;
  });
}

/**
 * Agrupa noticias por tema común para generar artículos más completos.
 */
export function clusterByTopic(news: NewsItem[], maxClusters: number = 3): NewsItem[][] {
  if (news.length === 0) return [];

  const used = new Set<number>();
  const clusters: NewsItem[][] = [];

  for (let i = 0; i < news.length && clusters.length < maxClusters; i++) {
    if (used.has(i)) continue;

    const cluster: NewsItem[] = [news[i]];
    used.add(i);

    for (let j = i + 1; j < news.length; j++) {
      if (used.has(j)) continue;
      if (titleSimilarity(news[i].title, news[j].title) > 0.25) {
        cluster.push(news[j]);
        used.add(j);
        if (cluster.length >= 4) break;
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}
