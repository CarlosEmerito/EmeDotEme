import { OLLAMA_TEXT_MODEL_DEFAULT, OLLAMA_URL } from './constants';

function getTime(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function logWithTime(msg: string) {
  console.log(`[${getTime()}] ${msg}`);
}

// --- Generación vía Ollama local (standalone) ---
export async function generateTextWithOllama({ systemPrompt, userPrompt }: { systemPrompt: string; userPrompt: string; }): Promise<string | null> {
  const model = process.env.OLLAMA_MODEL || OLLAMA_TEXT_MODEL_DEFAULT;
  const maxRetries = 2;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const prompt = `${systemPrompt}\n\n${userPrompt}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200000); // 20 min timeout

      const fetchNode = (await import('node-fetch')).default;
      const response = await fetchNode(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: true,
          options: {
            temperature: 0.1,
            num_ctx: 8192
          },
          keep_alive: 0
        }),
        signal: controller.signal as any
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${await response.text()}`);
      }

      logWithTime(`🤖 [Ollama ${model}] Generando texto en streaming...`);

      // --- PROCESAMIENTO DE STREAMING ---
      let fullResponse = "";
      const body = response.body;
      if (!body) throw new Error('No se pudo obtener el cuerpo de la respuesta');
      
      for await (const chunk of body) {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            const thinking = data.thinking || "";
            const responseText = data.response || "";
            
            if (thinking) {
              // Solo el thinking va a consola
              process.stdout.write(thinking);
            }
            
            const content = responseText || thinking;
            if (content) {
              fullResponse += content;
            }
            if (data.done) break;
          } catch (e) {
            // Ignorar fragmentos JSON incompletos
          }
        }
      }
      console.log('\n');
      logWithTime('✅ [Ollama] Generación completada.');
      return fullResponse;

    } catch (err: any) {
      attempt++;
      const isTimeout = err.name === 'AbortError' || err.type === 'aborted';
      
      if (attempt <= maxRetries) {
        const waitTime = 10000; // 10 segundos
        logWithTime(`⚠️ Intento ${attempt} fallido (${isTimeout ? 'Timeout' : err.message}). Reintentando en ${waitTime/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        logWithTime(`❌ Todos los intentos con Ollama han fallado: ${err.message}`);
        return null;
      }
    }
  }
  return null;
}

/**
 * Fuerza a Ollama a descargar todos los modelos de la VRAM y espera a que sea efectivo.
 */
export async function unloadOllamaModels(): Promise<void> {
  try {
    const fetchNode = (await import('node-fetch')).default;
    const model = process.env.OLLAMA_MODEL || OLLAMA_TEXT_MODEL_DEFAULT;
    
    // 1. Enviar orden de descarga
    await fetchNode(OLLAMA_URL.replace('/generate', '/load'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, keep_alive: 0 })
    });
    
    logWithTime('🧹 [VRAM] Orden de descarga enviada a Ollama. Esperando limpieza física...');
    
    // 2. Pausa obligatoria de 8 segundos para que el driver de NVIDIA limpie los buffers
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    logWithTime('🧹 [VRAM] Limpieza completada.');
  } catch (err) {
    logWithTime(`⚠️ No se pudo forzar la descarga de Ollama: ${err}`);
  }
}

// --- Post-procesado ortográfico vía Ollama local ---
export async function postprocessWithOllama(article: any): Promise<any> {
  const systemPrompt = `Eres un corrector ortográfico experto en español. Corrige las mayúsculas de nombres propios, siglas y títulos. No modifiques el contenido. Devuelve el resultado en formato JSON con los mismos campos. IMPORTANTE: Sé directo y eficiente en tu proceso de pensamiento. NO realices verificaciones repetitivas, palabra por palabra, ni bucles de revisión interminables. Haz una sola pasada de corrección y genera el JSON inmediatamente.`;
  const userPrompt = `Corrige las mayúsculas del siguiente artículo:\n\n${JSON.stringify({
    title: article.title,
    summary: article.summary,
    content: article.content
  }, null, 2)}\n\nDevuelve SOLO el JSON.`;
  
  const result = await generateTextWithOllama({ systemPrompt, userPrompt });
  if (!result) return article;
  
  try {
    // Limpiar code blocks y parsea JSON
    const cleaned = result.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      console.warn('⚠️ postprocess: JSON inválido, usando regex recovery...');
      return article;
    }
    
    let jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
    
    // Sanitizar
    jsonStr = sanitizeJsonString(jsonStr);
    
    const parsed = JSON.parse(jsonStr);
    console.log('✅ postprocess corregido');
    return { ...article, ...parsed };
  } catch (e) {
    // Recovery con regex
    try {
      const titleMatch = result.match(/"title"\s*:\s*"([^"]+)"/);
      const summaryMatch = result.match(/"summary"\s*:\s*"([^"]+)"/);
      const contentMatch = result.match(/"content"\s*:\s*"([\s\S]*?)",\s*}/);
      
      if (titleMatch) {
        console.log('⚠️ postprocess: recovery por regex');
        return {
          ...article,
          title: titleMatch[1],
          summary: summaryMatch ? summaryMatch[1] : article.summary,
          content: contentMatch ? contentMatch[1].replace(/\\n/g, '\n') : article.content
        };
      }
    } catch (err2) {
      console.error('❌ postprocess recovery falló:', err2);
    }
    return article;
  }
}
import { generateTextWithGemini } from './gemini-text.service';
import type { NewsItem } from '../news/news-sources.service';
import { formatNewsForPrompt } from '../news/news-sources.service';
import { sanitizeJsonString } from '../../lib/json-sanitizer';

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
// INTERFAZ DE RESPUESTA DEL ARTÍCULO
// ============================================================

export interface GeneratedArticle {
  title: string;
  summary: string;
  content: string;
  imagePrompt: string;
  tags: string[];
  /** URL principal de la fuente en la que se basa el artículo */
  sourceUrl?: string;
  /** Lista de todas las URLs de fuentes citadas */
  sources?: string[];
  /** Prompt para imagen */
  sourceImageUrl?: string;
  imageCaption?: string;
  category?: string;
  sentiment?: string;
}

// ============================================================
// GENERACIÓN CON FUENTES REALES
// ============================================================

/**
 * Genera un artículo basado en noticias reales de fuentes fiables.
 * Si se proporcionan newsItems, el artículo se basa en hechos verificables.
 * Si no hay noticias, genera un artículo genérico (comportamiento legacy).
 *
 * @param recentTitles Títulos recientes para evitar repetición
 * @param newsContext Noticias reales para usar como base del artículo
 */
export async function generateArticleContent(
  recentTitles: string[] = [],
  newsContext: NewsItem[] = []
): Promise<GeneratedArticle> {
  const hasRealNews = newsContext.length > 0;

  // ---- System Prompt ----
  const systemPrompt = hasRealNews
    ? `Eres un periodista especializado en tecnología y economía para el medio "EmeDotEme". Tu objetivo es redactar artículos informativos y profesionales basados en fuentes reales.`
    : `Eres un periodista especializado en tecnología y criptomonedas.`;

  // ---- Cláusula de evitación ----
  let avoidanceClause = '';
  if (recentTitles.length > 0) {
    const recentList = recentTitles.slice(0, 3).map(title => `- "${title}"`).join('\n');
    avoidanceClause = `\n\nEvita tratar temas muy similares a estos títulos recientes:\n${recentList}`;
  }

  // ---- User Prompt ----
  let userPrompt: string;

  if (hasRealNews) {
    const newsText = formatNewsForPrompt(newsContext.slice(0, 3)); // Solo las 3 más relevantes
    userPrompt = `Escribe un artículo periodístico en español basado en estas noticias:

  ${newsText}

  REQUISITOS:
  1. Título profesional.
  2. Resumen de 2 frases.
  3. Cuerpo extenso con subtítulos HTML (p, h2, h3).
  4. Lista de 3 etiquetas.
  5. Idea para una imagen en inglés (imagePrompt).
  6. Categoría (category): Elige estrictamente una de estas: Mercados, Tecnología, IA, Ciberseguridad, Criptomonedas.
  
  Responde ÚNICAMENTE en formato JSON:
  {
    "title": "...",
    "summary": "...",
    "content": "...",
    "tags": ["...", "..."],
    "imagePrompt": "...",
    "category": "...",
    "sourceUrl": "${newsContext[0]?.link || ''}",
    "sources": ["${newsContext[0]?.link || ''}"]
  }.${avoidanceClause}`;
  } else {
    userPrompt = `Escribe un artículo sobre tecnología en español.
  
  Categoría (category): Elige estrictamente una de estas: Mercados, Tecnología, IA, Ciberseguridad, Criptomonedas.
  
  Responde SOLO en JSON:
  {
    "title": "...",
    "summary": "...",
    "content": "...",
    "tags": ["..."],
    "category": "...",
    "imagePrompt": "..."
  }.${avoidanceClause}`;
  }
  
  let result = await generateTextWithGemini({ systemPrompt, userPrompt, maxTokens: 6000, temperature: 0.7 });
  if (!result || result.includes('Lo siento') || result.length < 200) {
    if (result) console.warn(`⚠️ Gemini dio una respuesta no válida o rechazo: "${result.substring(0, 50)}..."`);
    console.warn('⚠️ Intentando con Ollama local...');
    await unloadOllamaModels();
    result = await generateTextWithOllama({ systemPrompt, userPrompt });
    if (!result) {
      throw new Error('❌ Error crítico: Ni Gemini ni Ollama pudieron generar el contenido.');
    }
  }

  try {
    const cleaned = result.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      throw new Error('JSON no encontrado en la respuesta');
    }
    
    let jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
    jsonStr = sanitizeJsonString(jsonStr);
    
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (firstErr) {
      const aggressive = jsonStr.replace(/[\x00-\x1F\x7F]/g, (ch) => {
        if (ch === '\n') return '\\n';
        if (ch === '\r') return '\\r';
        if (ch === '\t') return '\\t';
        return '';
      });
      parsed = JSON.parse(aggressive);
    }
    
    if (!parsed.title) throw new Error('Falta título');
    
    return parsed as GeneratedArticle;
  } catch (error) {
    console.error(`❌ Error parseando JSON, intentando recuperación Regex...`);
    
    try {
      // Regex mejoradas para capturar campos incluso en Markdown
      const titleMatch = result.match(/(?:"title"\s*:\s*"|Título\s*:\s*|\*\*\s*Título\s*:\s*\*\*\s*|#\s*)([^"}\n\n]+)/i);
      const summaryMatch = result.match(/(?:"summary"\s*:\s*"|Resumen\s*:\s*|\*\*\s*Resumen\s*:\s*\*\*\s*)([^"}\n\n]+)/i);
      const contentMatch = result.match(/(?:"content"\s*:\s*"|Contenido\s*:\s*|\*\*\s*Contenido\s*:\s*\*\*\s*)([\s\S]+?)(?=",\s*"|(?:"\s*})|\*\*|#|$)/i);
      const imageMatch = result.match(/(?:"imagePrompt"\s*:\s*"|imagePrompt\s*:\s*|Imagen sugerida\s*:\s*|\*\*\s*imagePrompt\s*:\s*\*\*\s*)([^"}\n\n]+)/i);

      if (titleMatch && titleMatch[1]) {
        console.log(`🔄 Recuperado con Regex: "${titleMatch[1].substring(0, 50)}..."`);
        
        let content = contentMatch ? contentMatch[1].trim() : '';
        content = content.replace(/\\n/g, '\n').replace(/\\"/g, '"');
        
        return {
          title: titleMatch[1].trim().replace(/^"|"$/g, ''),
          summary: summaryMatch ? summaryMatch[1].trim().replace(/^"|"$/g, '') : '',
          content: content.length > 50 ? content : '<p>Contenido recuperado de emergencia.</p>',
          imagePrompt: imageMatch ? imageMatch[1].trim().replace(/^"|"$/g, '') : 'technology, innovation',
          tags: [],
          sourceUrl: newsContext[0]?.link || '',
          sources: newsContext.map(n => n.link),
        };
      }
    } catch (regErr) {
      console.error('❌ Falló recuperación Regex');
    }
    
    throw new Error(`❌ Error crítico en generación: ${error}`);
  }
}

/**
 * Genera contenido bilingüe (español e inglés) desde el inicio.
 * Primero genera en español, luego usa ese contenido como base para generar en inglés.
 * 
 * @param recentTitles Títulos recientes para evitar repetición
 * @param newsContext Noticias reales para usar como base del artículo
 */
export async function generateBilingualContent(
  recentTitles: string[] = [],
  newsContext: NewsItem[] = []
): Promise<GeneratedArticle & { titleEn: string; summaryEn: string; contentEn: string }> {
  const t0 = Date.now();
  console.log('\n🌍 INICIANDO GENERACIÓN BILINGÜE');
  
  // === Paso 1: Generar en Español ===
  console.log('\n🇪🇸 [1/2] Generando artículo en español...');
  let esArticle = await generateArticleContent(recentTitles, newsContext);
  
  // Post-procesado ortográfico por IA local (Ollama)
  console.log("\n🔍 Post-procesando texto con Ollama para mejorar ortografía y estilo...");
  esArticle = await postprocessWithOllama(esArticle);
  
  // === Paso 2: Generar en Inglés ===
  console.log('\n🇬🇧 [2/2] Generando artículo en inglés...');
  const enArticle = await generateEnglishContent(esArticle, newsContext);
  
  const t1 = Date.now();
  console.log(`\n✅ Generación bilingüe completada en ${((t1 - t0) / 1000).toFixed(2)} segundos`);
  
  return {
    ...esArticle,
    titleEn: enArticle.titleEn,
    summaryEn: enArticle.summaryEn,
    contentEn: enArticle.contentEn
  };
}

/**
 * Genera la versión en inglés del artículo basándose en el contenido español
 * y las noticias originales.
 */
async function generateEnglishContent(
  esArticle: GeneratedArticle,
  newsContext: NewsItem[]
): Promise<{ titleEn: string; summaryEn: string; contentEn: string }> {
  const hasRealNews = newsContext.length > 0;
  
  const systemPrompt = `You are a professional journalist for the digital media "EmeDotEme". Your goal is to write informative and professional news articles in English.`;

  let avoidanceClause = '';
  if (esArticle.tags && esArticle.tags.length > 0) {
    avoidanceClause = `\n\nAVOID topics related to: ${esArticle.tags.join(', ')}.`;
  }

  let userPrompt: string;

  if (hasRealNews) {
    userPrompt = `Write an English version of this Spanish news article:

SPANISH ORIGINAL:
Title: ${esArticle.title}
Summary: ${esArticle.summary}
Content: ${esArticle.content}

INSTRUCTIONS:
- Write ONLY in English.
- Use professional news style.
- Include title, summary (2 sentences), and long content with HTML tags (p, h2, h3).
- Return ONLY a valid JSON object.

JSON Format:
{
  "titleEn": "...",
  "summaryEn": "...",
  "contentEn": "..."
}.${avoidanceClause}`;
  } else {
    userPrompt = `Translate and adapt this article for English readers. Return ONLY JSON.

SPANISH ORIGINAL:
Title: ${esArticle.title}
Summary: ${esArticle.summary}
Content: ${esArticle.content}

JSON Format:
{
  "titleEn": "...",
  "summaryEn": "...",
  "contentEn": "..."
}.${avoidanceClause}`;
  }

  let result = await generateTextWithGemini({ systemPrompt, userPrompt, maxTokens: 6000, temperature: 0.7 });
  if (!result || result.includes('Sorry') || result.length < 200) {
    console.warn('⚠️ Gemini falló para EN, intentando con Ollama...');
    result = await generateTextWithOllama({ systemPrompt, userPrompt });
    if (!result) {
      throw new Error('❌ Error crítico: Falló la generación en inglés.');
    }
  }

  try {
    const cleaned = result.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) throw new Error('Invalid JSON structure');

    let jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
    jsonStr = sanitizeJsonString(jsonStr);

    const parsed = JSON.parse(jsonStr);
    
    return {
      titleEn: parsed.titleEn || parsed.title || esArticle.title,
      summaryEn: parsed.summaryEn || parsed.summary || esArticle.summary,
      contentEn: parsed.contentEn || parsed.content || esArticle.content
    };
  } catch (error) {
    console.error('❌ Error parsing English content, trying Regex...');
    
    try {
      const titleMatch = result.match(/(?:"titleEn"\s*:\s*"|titleEn\s*:\s*|Title\s*:\s*|#\s*)([^"}\n\n]+)/i);
      const summaryMatch = result.match(/(?:"summaryEn"\s*:\s*"|summaryEn\s*:\s*|Summary\s*:\s*)([^"}\n\n]+)/i);
      const contentMatch = result.match(/(?:"contentEn"\s*:\s*"|contentEn\s*:\s*|Content\s*:\s*)([\s\S]+?)(?=",\s*"|(?:"\s*})|#|$)/i);

      if (titleMatch && titleMatch[1]) {
        return {
          titleEn: titleMatch[1].trim().replace(/^"|"$/g, ''),
          summaryEn: summaryMatch ? summaryMatch[1].trim().replace(/^"|"$/g, '') : esArticle.summary,
          contentEn: contentMatch ? contentMatch[1].trim().replace(/\\n/g, '\n').replace(/\\"/g, '"') : esArticle.content
        };
      }
    } catch (regexError) {
      console.error('❌ Falló recovery regex EN');
    }
    
    throw new Error('❌ Error crítico: Falló el parseo de la versión en inglés.');
  }
}

/**
 * Traduce el artículo generado al inglés (implementación mínima, solo copia los campos).
 */
export async function translateArticleContent(article: any) {
	return {
		...article,
		titleEn: article.title + ' (EN)',
		summaryEn: article.summary + ' (EN)',
		contentEn: article.content + ' (EN)'
	};
}
