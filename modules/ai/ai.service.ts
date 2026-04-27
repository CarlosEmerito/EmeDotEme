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
      logWithTime(`🤖 [Ollama ${model}] Intento ${attempt + 1}/${maxRetries + 1}...`);
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
      if (!response.ok) {
        logWithTime(`❌ Ollama respondió con error HTTP ${response.status}`);
        throw new Error(`Error HTTP ${response.status}`);
      }

      logWithTime(`🤖 [Ollama ${model}] Recibiendo stream de respuesta...`);
      let fullResponse = "";
      const body = response.body;
      if (!body) throw new Error('No body');
      
      const decoder = new TextDecoder();
      // @ts-ignore
      for await (const chunk of body) {
        const lines = decoder.decode(chunk as BufferSource, { stream: true }).split('\n');
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
      logWithTime(`✅ Ollama completó la generación (${fullResponse.length} caracteres).`);
      return fullResponse;
    } catch (err: any) {
      logWithTime(`⚠️ Error en intento ${attempt + 1}: ${err.message}`);
      attempt++;
      if (attempt <= maxRetries) {
        const waitTime = 5000 * attempt;
        logWithTime(`⏳ Esperando ${waitTime/1000}s antes de reintentar...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        logWithTime('❌ Se agotaron los reintentos para Ollama.');
        return null;
      }
    }
  }

  return null;
}

// ============================================================
// NEWSLETTER
// ============================================================

/**
 * Genera el contenido de la newsletter semanal usando Gemini.
 */
export async function generateWeeklyNewsletter(articles: any[]) {
  const systemPrompt = AI_PROMPTS.NEWSLETTER.SYSTEM;
  const userPrompt = AI_PROMPTS.NEWSLETTER.USER(articles);

  logWithTime(`🗞️ Generando newsletter con ${articles.length} noticias...`);
  
  const result = await generateTextWithGemini({ 
    systemPrompt, 
    userPrompt, 
    maxTokens: 8000, 
    temperature: 0.7 
  });

  if (!result) throw new Error('Fallo la generación de la newsletter');

  try {
    const jsonStr = sanitizeJsonString(extractJson(result));
    const parsed = JSON.parse(jsonStr);
    return {
      subject: parsed.subject || "EmeDotEme News: Tu resumen semanal",
      htmlContent: parsed.htmlContent || "<p>Error al generar el contenido de la newsletter.</p>"
    };
  } catch (error) {
    logWithTime('⚠️ Error parseando newsletter de Gemini. Usando fallback básico.');
    return {
      subject: "EmeDotEme News: Tu resumen semanal",
      htmlContent: `<p>Esta semana hemos tenido ${articles.length} noticias importantes. Visita nuestra web para ver el detalle.</p>`
    };
  }
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
): Promise<GeneratedArticle & { 
  titleEn: string; 
  summaryEn: string; 
  keyPointsEn: string[]; 
  contentEn: string;
  glossaryEn?: { term: string; definition: string }[];
  faqsEn?: { question: string; answer: string }[];
}> {
  logWithTime('🇪🇸 Iniciando generación en español...');
  const esArticle = await generateArticleContent(recentTitles, newsContext);
  
  logWithTime('🇬🇧 Iniciando traducción/generación en inglés...');
  const enArticle = await generateEnglishContent(esArticle);
  
  logWithTime('✅ Contenido bilingüe listo.');
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

  logWithTime('📡 Solicitando traducción a Gemini...');
  let result = await generateTextWithGemini({ systemPrompt, userPrompt, maxTokens: 6000, temperature: 0.7 });
  if (!result || result.length < 200) {
    logWithTime('⚠️ Fallback a Ollama para inglés...');
    result = await generateTextWithOllama({ systemPrompt, userPrompt });
  }
  if (!result) throw new Error('Fallo generación en inglés');

  try {
    const parsed = JSON.parse(sanitizeJsonString(extractJson(result)));
    logWithTime('✅ Traducción completada y parseada.');
    return {
      titleEn: parsed.titleEn || esArticle.title,
      summaryEn: parsed.summaryEn || esArticle.summary,
      keyPointsEn: parsed.keyPointsEn || esArticle.keyPoints || [],
      glossaryEn: parsed.glossaryEn || [],
      faqsEn: parsed.faqsEn || [],
      contentEn: parsed.contentEn || esArticle.content
    };
  } catch {
    logWithTime('⚠️ Error parseando traducción, usando fallback de contenido original.');
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
      keyPoints: [],
      impactLevel: "Informativo 📰",
      complexity: "Principiante 🟢",
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
