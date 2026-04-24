import { OLLAMA_URL } from './constants';
import { AI_PROMPTS } from '../../config/prompts';
import { unloadOllamaModels } from '../vram/vram-manager';
import { generateTextWithGemini } from './gemini-text.service';
import type { NewsItem } from '../news/news-sources.service';
import { formatNewsForPrompt } from '../news/news-sources.service';
import { sanitizeJsonString } from '../../lib/json-sanitizer';

function getTime(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function logWithTime(msg: string) {
  console.log(`[${getTime()}] ${msg}`);
}

// ============================================================
// INTERFACES
// ============================================================

export interface GeneratedArticle {
  title: string;
  summary: string;
  content: string;
  imagePrompt: string;
  tags: string[];
  sourceUrl?: string;
  sources?: string[];
  sourceImageUrl?: string;
  imageCaption?: string;
  category?: string;
  sentiment?: string;
}

// ============================================================
// GENERACIÓN CORE (OLLAMA & GEMINI)
// ============================================================

export async function generateTextWithOllama({ systemPrompt, userPrompt }: { systemPrompt: string; userPrompt: string; }): Promise<string | null> {
  const model = process.env.OLLAMA_MODEL;
  if (!model) {
    throw new Error('❌ Error: La variable de entorno OLLAMA_MODEL no está configurada.');
  }
  const maxRetries = 2;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const prompt = `${systemPrompt}\n\n${userPrompt}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200000); // 20 min

      const fetchNode = (await import('node-fetch')).default;
      const response = await fetchNode(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: true,
          options: { temperature: 0.1, num_ctx: 8192 },
          keep_alive: 0
        }),
        signal: controller.signal as any
      });
      
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

      logWithTime(`🤖 [Ollama ${model}] Generando texto...`);
      let fullResponse = "";
      const body = response.body;
      if (!body) throw new Error('No body');
      
      // @ts-ignore
      for await (const chunk of body) {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            const content = data.response || data.thinking || "";
            if (content) fullResponse += content;
            if (data.done) break;
          } catch (e) {}
        }
      }
      return fullResponse;
    } catch (err: any) {
      attempt++;
      if (attempt <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else return null;
    }
  }
  return null;
}

// ============================================================
// NEWSLETTER
// ============================================================

/**
 * Placeholder para generación de newsletter semanal
 */
export async function generateWeeklyNewsletter(..._args: any[]) {
  return {
    subject: 'Newsletter semanal (placeholder)',
    html: '<p>Contenido de ejemplo generado por IA.</p>',
    htmlContent: '<p>Contenido de ejemplo generado por IA.</p>',
    articles: []
  };
}

// ============================================================
// PIPELINE DE GENERACIÓN DE ARTÍCULO
// ============================================================

export async function generateArticleContent(
  recentTitles: string[] = [],
  newsContext: NewsItem[] = []
): Promise<GeneratedArticle> {
  const hasRealNews = newsContext.length > 0;
  const systemPrompt = AI_PROMPTS.SPANISH.SYSTEM(hasRealNews);
  
  let avoidanceClause = '';
  if (recentTitles.length > 0) {
    const recentList = recentTitles.slice(0, 3).map(title => `- "${title}"`).join('\n');
    avoidanceClause = `\n\nEvita temas similares a:\n${recentList}`;
  }

  const userPrompt = hasRealNews 
    ? AI_PROMPTS.SPANISH.USER_WITH_NEWS(formatNewsForPrompt(newsContext.slice(0, 3)), avoidanceClause)
    : AI_PROMPTS.SPANISH.USER_WITHOUT_NEWS(avoidanceClause);
  
  let result = await generateTextWithGemini({ systemPrompt, userPrompt, maxTokens: 6000, temperature: 0.7 });
  
  if (!result || result.includes('Lo siento') || result.length < 200) {
    logWithTime('⚠️ Fallback a Ollama...');
    await unloadOllamaModels();
    result = await generateTextWithOllama({ systemPrompt, userPrompt });
  }

  if (!result) throw new Error('Fallaron todos los modelos de generación.');

  return parseAndRecoverJson(result, newsContext);
}

export async function generateBilingualContent(
  recentTitles: string[] = [],
  newsContext: NewsItem[] = []
): Promise<GeneratedArticle & { titleEn: string; summaryEn: string; contentEn: string }> {
  let esArticle = await generateArticleContent(recentTitles, newsContext);
  esArticle = await postprocessWithOllama(esArticle);
  
  const enArticle = await generateEnglishContent(esArticle);
  
  return { ...esArticle, ...enArticle };
}

async function generateEnglishContent(esArticle: GeneratedArticle): Promise<{ titleEn: string; summaryEn: string; contentEn: string }> {
  const systemPrompt = AI_PROMPTS.ENGLISH.SYSTEM;
  const userPrompt = AI_PROMPTS.ENGLISH.USER_TRANSLATE(esArticle, "");

  let result = await generateTextWithGemini({ systemPrompt, userPrompt, maxTokens: 6000, temperature: 0.7 });
  if (!result || result.length < 200) {
    result = await generateTextWithOllama({ systemPrompt, userPrompt });
  }
  if (!result) throw new Error('Fallo generación en inglés');

  try {
    const parsed = JSON.parse(sanitizeJsonString(extractJson(result)));
    return {
      titleEn: parsed.titleEn || esArticle.title,
      summaryEn: parsed.summaryEn || esArticle.summary,
      contentEn: parsed.contentEn || esArticle.content
    };
  } catch {
    return { titleEn: esArticle.title, summaryEn: esArticle.summary, contentEn: esArticle.content };
  }
}

export async function postprocessWithOllama(article: any): Promise<any> {
  const systemPrompt = AI_PROMPTS.CORRECTION.SYSTEM;
  const userPrompt = AI_PROMPTS.CORRECTION.USER(article);
  
  const result = await generateTextWithOllama({ systemPrompt, userPrompt });
  if (!result) return article;
  
  try {
    const parsed = JSON.parse(sanitizeJsonString(extractJson(result)));
    return { ...article, ...parsed };
  } catch {
    return article;
  }
}

// ============================================================
// UTILIDADES DE PARSEO
// ============================================================

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
    const parsed = JSON.parse(jsonStr);
    if (!parsed.title) throw new Error('No title');
    return parsed;
  } catch (error) {
    logWithTime('⚠️ Recuperación por Regex...');
    const titleMatch = result.match(/(?:"title"\s*:\s*"|Título\s*:\s*|#\s*)([^"}\n\n]+)/i);
    const summaryMatch = result.match(/(?:"summary"\s*:\s*"|Resumen\s*:\s*)([^"}\n\n]+)/i);
    const contentMatch = result.match(/(?:"content"\s*:\s*"|Contenido\s*:\s*)([\s\S]+?)(?=",\s*"|(?:"\s*})|#|$)/i);

    return {
      title: titleMatch?.[1].trim() || "Artículo sin título",
      summary: summaryMatch?.[1].trim() || "",
      content: contentMatch?.[1].trim().replace(/\\n/g, '\n').replace(/\\"/g, '"') || "",
      imagePrompt: "technology, digital art",
      tags: [],
      sourceUrl: newsContext[0]?.link || ""
    };
  }
}
