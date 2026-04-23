import { test } from 'node:test';
import { performance } from 'node:perf_hooks';

// We'll read the file directly or we can just mock the original function vs optimized

const originalTitleSimilarity = (a: string, b: string): number => {
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

const titleCache = new Map<string, Set<string>>();
function getNormalizedWords(s: string): Set<string> {
  let words = titleCache.get(s);
  if (words) return words;

  if (titleCache.size > 1000) {
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

const optimizedTitleSimilarity = (a: string, b: string): number => {
  const wordsA = getNormalizedWords(a);
  const wordsB = getNormalizedWords(b);

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  // Optimize by iterating over the smaller set
  const [smaller, larger] = wordsA.size < wordsB.size ? [wordsA, wordsB] : [wordsB, wordsA];

  for (const word of smaller) {
    if (larger.has(word)) intersection++;
  }

  const union = wordsA.size + wordsB.size - intersection;
  return intersection / union;
}


const titles = [
  "Bitcoin supera los 60,000 dolares por primera vez en semanas",
  "El precio de Bitcoin se dispara a 60K",
  "Ethereum cae mientras el mercado cripto sufre",
  "Nuevas regulaciones de la SEC afectan a las criptomonedas",
  "Mercados globales reaccionan a la tasa de interes de la FED",
  "Tesla anuncia compra masiva de Bitcoin",
  "Elon Musk tuitea sobre Dogecoin otra vez",
  "Analisis de mercado: por que esta cayendo Ethereum",
  "La SEC podria aprobar un ETF de Ethereum",
  "La FED sube tasas de interes y el mercado cae",
];

test('benchmark titleSimilarity', () => {
  const ITERATIONS = 10000;

  const startOriginal = performance.now();
  let dummy1 = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    for (const t1 of titles) {
      for (const t2 of titles) {
        dummy1 += originalTitleSimilarity(t1, t2);
      }
    }
  }
  const endOriginal = performance.now();
  console.log(`Original: ${(endOriginal - startOriginal).toFixed(2)}ms (dummy: ${dummy1})`);

  const startOptimized = performance.now();
  let dummy2 = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    for (const t1 of titles) {
      for (const t2 of titles) {
        dummy2 += optimizedTitleSimilarity(t1, t2);
      }
    }
  }
  const endOptimized = performance.now();
  console.log(`Optimized: ${(endOptimized - startOptimized).toFixed(2)}ms (dummy: ${dummy2})`);
  console.log(`Improvement: ${((endOriginal - startOriginal) / (endOptimized - startOptimized)).toFixed(2)}x faster`);
});
