import { AI_PROMPTS, type ArticlePromptContext } from '../../config/prompts';
import { generateTextWithGemini } from './gemini-text.service';
import type { NewsItem } from '../news/news-sources.service';
import { formatNewsForPrompt, enrichWithFullText } from '../news/news-sources.service';
import { sanitizeJsonString } from '../../lib/json-sanitizer';
import { logWithTime } from '../../lib/logger';
import { ALLOWED_TICKERS, MAX_TAGS, MAX_TICKERS } from '../../config/editorial';
import { auditAndFixArticle } from './text-qa.service';
import {
  CATEGORY_VALUES,
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
  tickers?: string[];
  glossary?: { term: string; definition: string }[];
  faqs?: { question: string; answer: string }[];
  content: string;
  imagePrompt: string;
  tags: string[];
  sourceUrl?: string;
  sourceImageUrl?: string;
  imageCaption?: string;
  category?: string;
  /**
   * Registro del control de calidad del texto (auditoría contra las fuentes).
   * Se guarda con el artículo como prueba de la revisión y se enseña al
   * aprobar el borrador.
   */
  textQa?: string;
}

/** Contexto opcional de generación. */
export interface GenerationOptions {
  /**
   * Etiquetas que ya existen en el medio: se le enseñan al modelo para que
   * reutilice las que encajen en vez de inventar sinónimos que fragmentan las
   * páginas de etiqueta.
   */
  existingTags?: string[];
  /** Fecha que se le da al modelo como «hoy». Por defecto, la del sistema. */
  today?: Date;
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
  newsContext: NewsItem[] = [],
  options: GenerationOptions = {}
): Promise<GeneratedArticle> {
  if (newsContext.length === 0) {
    throw new Error('ERROR CRÍTICO: No se encontraron noticias de fuentes fiables. No se generará contenido sin fuentes reales. La publicación ha sido cancelada.');
  }

  // La deduplicación de temas se hace en la capa de noticias (clustering); aquí
  // solo se deja constancia de cuántos títulos ya cubiertos se han tenido en cuenta.
  logWithTime(`🧷 Contexto: ${recentTitles.length} títulos ya cubiertos por el medio.`);

  const systemPrompt = AI_PROMPTS.SPANISH.SYSTEM;

  // Se descarga el artículo original de las primeras fuentes del clúster. Sin
  // este paso el modelo solo recibe la entradilla del feed (300 caracteres) y
  // cualquier «análisis detallado» que escriba lo tiene que inventar.
  const fuentes = await enrichWithFullText(newsContext.slice(0, 3));

  const ctx: ArticlePromptContext = {
    today: formatFechaLarga(options.today ?? new Date()),
    allowedTickers: ALLOWED_TICKERS,
    existingTags: options.existingTags ?? [],
  };

  const userPrompt = AI_PROMPTS.SPANISH.USER_WITH_NEWS(formatNewsForPrompt(fuentes), ctx);

  const result = await generateTextWithGemini({
    systemPrompt,
    userPrompt,
    maxTokens: 6000,
    // Temperatura baja: es texto factual. Con 0.7 el modelo adornaba y se iba
    // del dato, que es lo que luego cazaban los diagnósticos editoriales.
    temperature: 0.5,
    responseSchema: articleResponseSchema,
  });

  if (!result || result.includes('Lo siento') || result.length < 200) {
    throw new Error('Falló la generación de texto en Gemini (Límite de API o error). Abortando para evitar bucle local.');
  }

  const articulo = parseAndRecoverJson(result, newsContext);

  // Control de calidad del texto: se audita contra las fuentes y, si hay algo
  // que corregir, se reescribe una vez. Se hace aquí, antes de traducir al
  // inglés, para que la versión inglesa traduzca el texto ya corregido.
  const { articulo: revisado, informe } = await auditAndFixArticle(
    formatNewsForPrompt(fuentes),
    normalizar(articulo, newsContext)
  );

  return { ...normalizar(revisado, newsContext), textQa: informe.resumen };
}

export async function generateBilingualContent(
  recentTitles: string[] = [],
  newsContext: NewsItem[] = [],
  options: GenerationOptions = {}
): Promise<GeneratedArticle & {
  titleEn: string;
  summaryEn: string;
  keyPointsEn: string[];
  contentEn: string;
  glossaryEn?: { term: string; definition: string }[];
  faqsEn?: { question: string; answer: string }[];
}> {
  logWithTime('Iniciando generación en español...');
  const esArticle = await generateArticleContent(recentTitles, newsContext, options);

  logWithTime('Iniciando traducción/generación en inglés...');
  const enArticle = await generateEnglishContent(esArticle);

  logWithTime('Contenido bilingüe listo.');
  return { ...esArticle, ...enArticle };
}

/** Aplica lo que no puede depender del modelo: listas cerradas, longitudes y la URL real de la fuente. */
function normalizar(articulo: GeneratedArticle, newsContext: NewsItem[]): GeneratedArticle {
  const contenido = articulo.content || '';
  return {
    ...articulo,
    summary: clampSummary(articulo.summary),
    tickers: sanitizeTickers(articulo.tickers),
    tags: sanitizeTags(articulo.tags),
    // El glosario solo vale si el término aparece de verdad en el texto.
    glossary: sanitizeGlossary(articulo.glossary, `${contenido} ${articulo.summary || ''}`),
    // La URL de la fuente la pone el sistema, no el modelo: es la atribución
    // del artículo publicado y no puede depender de lo que invente.
    sourceUrl: newsContext[0]?.link ?? '',
  };
}

/** Máximo del resumen: es la descripción que usa el buscador y la tarjeta social. */
const MAX_SUMMARY_CHARS = 240;

/**
 * Recorta el resumen por frase si se pasa. El prompt pide 150-220 caracteres y
 * a veces el modelo se estira: aquí se corta en el último punto que quepa, sin
 * dejar la frase a medias.
 */
export function clampSummary(summary: string): string {
  const limpio = String(summary || '').trim();
  if (limpio.length <= MAX_SUMMARY_CHARS) return limpio;

  const recorte = limpio.slice(0, MAX_SUMMARY_CHARS);
  const ultimoPunto = Math.max(recorte.lastIndexOf('. '), recorte.lastIndexOf('! '), recorte.lastIndexOf('? '));
  if (ultimoPunto > 100) return recorte.slice(0, ultimoPunto + 1).trim();

  const ultimoEspacio = recorte.lastIndexOf(' ');
  return `${(ultimoEspacio > 100 ? recorte.slice(0, ultimoEspacio) : recorte).trim()}…`;
}

/**
 * Deja solo los términos del glosario que aparecen en el artículo: el modelo
 * tiende a colar términos que ha visto en enlaces relacionados y no en el texto.
 */
export function sanitizeGlossary(
  glossary: { term: string; definition: string }[] = [],
  textoDelArticulo: string
): { term: string; definition: string }[] {
  const heno = textoDelArticulo.toLowerCase();
  return glossary.filter((entrada) => {
    const termino = String(entrada?.term || '').trim().toLowerCase();
    return termino.length > 2 && heno.includes(termino);
  });
}

/** Deja solo símbolos admitidos, en mayúsculas, sin repetir y máximo MAX_TICKERS. */
export function sanitizeTickers(tickers: string[] = []): string[] {
  const admitidos = new Set<string>(ALLOWED_TICKERS);
  return tickers
    .map((ticker) => String(ticker).trim().toUpperCase().replace(/[^A-Z]/g, ''))
    .filter((ticker) => admitidos.has(ticker))
    .filter((ticker, i, todos) => todos.indexOf(ticker) === i)
    .slice(0, MAX_TICKERS);
}

/** Normaliza etiquetas (minúsculas, sin repetir) y recorta a MAX_TAGS. */
export function sanitizeTags(tags: string[] = []): string[] {
  return tags
    .map((tag) => String(tag).trim().toLowerCase())
    .filter((tag) => tag.length > 1)
    .filter((tag, i, todos) => todos.indexOf(tag) === i)
    .slice(0, MAX_TAGS);
}

/** «8 de octubre de 2026»: la fecha que se le da al modelo como referencia. */
function formatFechaLarga(fecha: Date): string {
  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
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
  const userPrompt = AI_PROMPTS.ENGLISH.USER_TRANSLATE(esArticle);

  logWithTime('Solicitando traducción a Gemini...');
  const result = await generateTextWithGemini({
    systemPrompt,
    userPrompt,
    maxTokens: 6000,
    // Traducir no es redactar: aquí no queremos ninguna libertad creativa.
    temperature: 0.2,
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

/**
 * El esquema zod corrige una categoría inválida a «Tecnología» para no romper
 * la generación, pero antes era una corrección silenciosa: aquí se avisa.
 */
function avisarCategoriaFueraDeLista(categoria: unknown): void {
  if (typeof categoria !== 'string') return;
  if (!(CATEGORY_VALUES as readonly string[]).includes(categoria)) {
    logWithTime(
      `⚠️ El modelo propuso la categoría «${categoria}», que no está en la lista: se guarda como «Tecnología».`
    );
  }
}

function parseAndRecoverJson(result: string, newsContext: NewsItem[]): GeneratedArticle {
  try {
    const jsonStr = sanitizeJsonString(extractJson(result));
    const bruto = JSON.parse(jsonStr);
    avisarCategoriaFueraDeLista(bruto?.category);
    // Con responseSchema forzando la forma del JSON en la propia API de Gemini,
    // este parseo+validación debería ser el camino habitual. El bloque de abajo
    // (regex) queda solo como red de seguridad ante fallos totalmente inesperados.
    return articleZodSchema.parse(bruto);
  } catch {
    logWithTime('Recuperación por Regex...');
    const titleMatch = result.match(/(?:"title"\s*:\s*"|Título\s*:\s*|#\s*)([^"}\n\n]+)/i);
    const summaryMatch = result.match(/(?:"summary"\s*:\s*"|Resumen\s*:\s*)([^"}\n\n]+)/i);
    const contentMatch = result.match(/(?:"content"\s*:\s*"|Contenido\s*:\s*)([\s\S]+?)(?=",\s*"|(?:"\s*})|#|$)/i);

    return {
      title: titleMatch?.[1].trim() || "Artículo sin título",
      summary: summaryMatch?.[1].trim() || "",
      keyPoints: [],
      tickers: [],
      glossary: [],
      faqs: [],
      content: contentMatch?.[1].trim().replace(/\\n/g, '\n').replace(/\\"/g, '"') || "",
      imagePrompt: "A journalist working at a desk with a laptop and a notebook, natural office lighting, realistic press photography",
      tags: [],
      sourceUrl: newsContext[0]?.link || ""
    };
  }
}
