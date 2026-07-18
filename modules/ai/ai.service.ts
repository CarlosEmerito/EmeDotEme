import { AI_PROMPTS } from '../../config/prompts';
import { generateTextWithGemini } from './gemini-text.service';
import type { NewsItem } from '../news/news-sources.service';
import { formatNewsForPrompt } from '../news/news-sources.service';
import { sanitizeJsonString } from '../../lib/json-sanitizer';
import { logWithTime } from '../../lib/logger';
import {
  articleResponseSchema,
  articleZodSchema,
  englishArticleResponseSchema,
  englishArticleZodSchema,
  newsletterResponseSchema,
  newsletterZodSchema,
} from './schemas';

export interface GeneratedArticle {
  title: string;
  summary: string;
  keyPoints: string[];
  impactLevel?: string;
  complexity?: string;
  tickers?: string[];
  glossary?: { term: string; definition: string }[];
  faqs?: { question: string; answer: string }[];
  content: string;
  imagePrompt: string;
  tags: string[];
  sourceUrl?: string;
  sources?: string[];
  sourceImageUrl?: string;
  imageCaption?: string;
  category?: string;
}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateWeeklyNewsletter(articles: any[]) {
  const systemPrompt = AI_PROMPTS.NEWSLETTER.SYSTEM;
  const userPrompt = AI_PROMPTS.NEWSLETTER.USER(articles);

  logWithTime(`Generando newsletter con ${articles.length} noticias...`);

  const result = await generateTextWithGemini({
    systemPrompt,
    userPrompt,
    maxTokens: 8000,
    temperature: 0.7,
    responseSchema: newsletterResponseSchema,
  });

  if (!result) throw new Error('Fallo la generación de la newsletter');

  try {
    const jsonStr = sanitizeJsonString(extractJson(result));
    return newsletterZodSchema.parse(JSON.parse(jsonStr));
  } catch {
    logWithTime('Error parseando/validando newsletter de Gemini. Usando fallback básico.');
    return {
      subject: "EmeDotEme News: Tu resumen semanal",
      htmlContent: `<p>Esta semana hemos tenido ${articles.length} noticias importantes. Visita nuestra web para ver el detalle.</p>`
    };
  }
}

export async function generateArticleContent(
  recentTitles: string[] = [],
  newsContext: NewsItem[] = []
): Promise<GeneratedArticle> {
  if (newsContext.length === 0) {
    throw new Error('ERROR CRÍTICO: No se encontraron noticias de fuentes fiables. No se generará contenido sin fuentes reales. La publicación ha sido cancelada.');
  }

  const systemPrompt = AI_PROMPTS.SPANISH.SYSTEM;

  let avoidanceClause = '';
  if (recentTitles.length > 0) {
    const recentList = recentTitles.slice(0, 3).map(title => `- "${title}"`).join('\n');
    avoidanceClause = `\n\nEvita temas similares a:\n${recentList}`;
  }

  const userPrompt = AI_PROMPTS.SPANISH.USER_WITH_NEWS(formatNewsForPrompt(newsContext.slice(0, 3)), avoidanceClause);

  const result = await generateTextWithGemini({
    systemPrompt,
    userPrompt,
    maxTokens: 6000,
    temperature: 0.7,
    responseSchema: articleResponseSchema,
  });

  if (!result || result.includes('Lo siento') || result.length < 200) {
    throw new Error('Falló la generación de texto en Gemini (Límite de API o error). Abortando para evitar bucle local.');
  }

  if (!result) throw new Error('Fallaron todos los modelos de generación.');

  return parseAndRecoverJson(result, newsContext);
}

export async function generateBilingualContent(
  recentTitles: string[] = [],
  newsContext: NewsItem[] = []
): Promise<GeneratedArticle & {
  titleEn: string;
  summaryEn: string;
  keyPointsEn: string[];
  contentEn: string;
  glossaryEn?: { term: string; definition: string }[];
  faqsEn?: { question: string; answer: string }[];
}> {
  logWithTime('Iniciando generación en español...');
  const esArticle = await generateArticleContent(recentTitles, newsContext);

  logWithTime('Iniciando traducción/generación en inglés...');
  const enArticle = await generateEnglishContent(esArticle);

  logWithTime('Contenido bilingüe listo.');
  return { ...esArticle, ...enArticle };
}

async function generateEnglishContent(esArticle: GeneratedArticle): Promise<{
  titleEn: string;
  summaryEn: string;
  keyPointsEn: string[];
  contentEn: string;
  glossaryEn?: { term: string; definition: string }[];
  faqsEn?: { question: string; answer: string }[];
}> {
  const systemPrompt = AI_PROMPTS.ENGLISH.SYSTEM;
  const userPrompt = AI_PROMPTS.ENGLISH.USER_TRANSLATE(esArticle, "");

  logWithTime('Solicitando traducción a Gemini...');
  const result = await generateTextWithGemini({
    systemPrompt,
    userPrompt,
    maxTokens: 6000,
    temperature: 0.7,
    responseSchema: englishArticleResponseSchema,
  });
  if (!result || result.length < 200) {
    throw new Error('Falló la generación en inglés en Gemini. Abortando.');
  }

  try {
    const parsed = englishArticleZodSchema.parse(JSON.parse(sanitizeJsonString(extractJson(result))));
    logWithTime('Traducción completada, parseada y validada.');
    return parsed;
  } catch {
    logWithTime('Error parseando/validando traducción, usando fallback de contenido original.');
    return {
      titleEn: esArticle.title,
      summaryEn: esArticle.summary,
      keyPointsEn: esArticle.keyPoints || [],
      glossaryEn: [],
      faqsEn: [],
      contentEn: esArticle.content
    };
  }
}

function extractJson(text: string): string {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return "{}";
  return cleaned.substring(start, end + 1);
}

function parseAndRecoverJson(result: string, newsContext: NewsItem[]): GeneratedArticle {
  try {
    const jsonStr = sanitizeJsonString(extractJson(result));
    // Con responseSchema forzando la forma del JSON en la propia API de Gemini,
    // este parseo+validación debería ser el camino habitual. El bloque de abajo
    // (regex) queda solo como red de seguridad ante fallos totalmente inesperados.
    return articleZodSchema.parse(JSON.parse(jsonStr));
  } catch {
    logWithTime('Recuperación por Regex...');
    const titleMatch = result.match(/(?:"title"\s*:\s*"|Título\s*:\s*|#\s*)([^"}\n\n]+)/i);
    const summaryMatch = result.match(/(?:"summary"\s*:\s*"|Resumen\s*:\s*)([^"}\n\n]+)/i);
    const contentMatch = result.match(/(?:"content"\s*:\s*"|Contenido\s*:\s*)([\s\S]+?)(?=",\s*"|(?:"\s*})|#|$)/i);

    return {
      title: titleMatch?.[1].trim() || "Artículo sin título",
      summary: summaryMatch?.[1].trim() || "",
      keyPoints: [],
      impactLevel: "Informativo",
      complexity: "Principiante",
      tickers: [],
      glossary: [],
      faqs: [],
      content: contentMatch?.[1].trim().replace(/\\n/g, '\n').replace(/\\"/g, '"') || "",
      imagePrompt: "technology, digital art",
      tags: [],
      sourceUrl: newsContext[0]?.link || ""
    };
  }
}
