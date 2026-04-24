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
            if (data.response) {
              fullResponse += data.response;
              // Escribir directamente en stdout para que se vea en el log en tiempo real
              process.stdout.write(data.response);
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
  const systemPrompt = `Eres un corrector ortográfico experto en español. Corrige SOLO las mayúsculas de nombres propios, siglas y títulos. No modifiques el contenido. Devuelve el resultado en formato JSON con los mismos campos.`;
  const userPrompt = `Corrige las mayúsculas del siguiente artículo:\n\n${JSON.stringify({
    title: article.title,
    summary: article.summary,
    content: article.content
  }, null, 2)}\n\nDevuelve SOLO el JSON.`;
  
  const result = await generateTextWithOllama({ systemPrompt, userPrompt });
  if (!result) return article;
  
  try {
    // Limpiar code blocks y parsear JSON
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
    ? `Eres un periodista profesional de noticias sobre criptomonedas, blockchain y tecnología para el medio digital "EmeDotEme".

REGLAS IMPORTANTES:
1. BASA tu artículo ÚNICAMENTE en la información de las fuentes proporcionadas. NO inventes datos, cifras ni declaraciones.
2. ESCRIBE en español, aunque las fuentes estén en inglés. Traduce y adapta el contenido.
3. NO incluyas ninguna sección de "Fuentes" ni enlaces a las fuentes originales en el contenido HTML. La atribución se maneja por separado.
4. El contenido debe ser informativo, bien estructurado y profesional.
5. NO copies textualmente. Analiza, sintetiza y añade contexto editorial.
6. Si hay varias fuentes sobre el mismo tema, cruza la información para dar un análisis más completo.`
    : `Eres un generador de artículos de noticias sobre criptomonedas, blockchain y tecnología.`;

  // ---- Cláusula de evitación ----
  let avoidanceClause = '';
  if (recentTitles.length > 0) {
    console.log(`📋 Evitando temas recientes: ${recentTitles.length} artículos`);
    const recentList = recentTitles.slice(0, 3).map(title => `- "${title}"`).join('\n');
    avoidanceClause = `\n\nEVITA temas recientes como:\n${recentList}\n\nNO repitas temas similares.`;
  }

  // ---- User Prompt ----
  let userPrompt: string;

  if (hasRealNews) {
    const newsText = formatNewsForPrompt(newsContext);
    const sourceUrls = newsContext.map(n => n.link);

    userPrompt = `A continuación tienes noticias reales de fuentes verificadas. Usa esta información para generar UN artículo en español.

  ${newsText}

  INSTRUCCIONES:
  - Título: claro, atractivo, en español
  - Resumen: 1-2 líneas que capturen lo esencial
  - Contenido: HTML con etiquetas p, h2, h3. El artículo DEBE SER LARGO, PROFUNDO Y DETALLADO. Escribe como en un periódico digital líder (al menos 5 a 6 párrafos extensos). OBLIGATORIO: Intercala al menos 2 o 3 subtítulos secundarios (<h2> o <h3>) en medio del texto para dinamizar la lectura y separar las ideas. NO incluyas enlaces a fuentes ni sección de fuentes.
  - Tags: 3-5 palabras clave sin '#'
  - imagePrompt: descripción en inglés para generar una imagen ilustrativa
  - sourceUrl: la URL de la fuente principal (la más relevante)
  - sources: array con TODAS las URLs de las fuentes consultadas
  - Respeta las reglas ortográficas del español: usa mayúsculas en nombres propios y siglas.

  EVITA: hashtags en el HTML, inventar datos no presentes en las fuentes, incluir enlaces o sección de fuentes en el contenido.
  ATENCIÓN: Dado que la respuesta debe ser un JSON, NUNCA uses comillas dobles (") dentro del texto de los campos. Para el HTML, usa obligatoriamente comillas simples (ej: <h2 class='titulo'>) o escapa las comillas.

  Devuelve SOLO JSON válido: {title, summary, content, imagePrompt, tags, sourceUrl, sources}.${avoidanceClause}`;
  } else {
    userPrompt = `Genera un artículo de noticias cripto en español.
  - Título: claro y atractivo
  - Resumen: 1-2 líneas
  - Contenido: HTML con etiquetas p, h2, h3. El artículo DEBE SER LARGO, PROFUNDO Y DETALLADO. Extiéndete al menos 5 a 6 párrafos sustanciales. OBLIGATORIO: Intercala al menos 2 o 3 subtítulos secundarios (<h2> o <h3>) en medio del texto para dinamizar la lectura y dividir la introducción, desarrollo y conclusión técnica.
  - Tags: 3-5 palabras clave sin '#'
  - imagePrompt: descripción para generar imagen
  - Respeta las reglas ortográficas del español: usa mayúsculas en nombres propios y siglas.

  EVITA: hashtags en HTML, temas recientes listados arriba, contenido repetitivo.
  ATENCIÓN: Usa obligatoriamente comillas simples (') para cualquier atributo HTML. NO uses comillas dobles (") dentro de los campos para evitar romper el JSON.

  Devuelve SOLO JSON válido: {title, summary, content, imagePrompt, tags}.${avoidanceClause}`;
  }
  
  let result = await generateTextWithGemini({ systemPrompt, userPrompt, maxTokens: 6000, temperature: 0.7 });
  if (!result) {
    console.warn('⚠️ Gemini falló, limpiando VRAM e intentando con Ollama local...');
    await unloadOllamaModels(); // Asegurar GPU limpia para Ollama
    result = await generateTextWithOllama({ systemPrompt, userPrompt });
    if (!result) {
      throw new Error('❌ Error crítico: Ni Gemini ni Ollama pudieron generar el contenido del artículo.');
    }
  }
  try {
    // Elimina posibles code blocks y parsea JSON
    const cleaned = result.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    console.log(`📝 Gemini raw response length: ${result.length} chars`);
    console.log(`📝 First 800 chars: ${result.substring(0, 800)}${result.length > 800 ? '...' : ''}`);
    
    if (result.length < 100) {
      console.warn(`⚠️ Respuesta muy corta (${result.length} chars), posiblemente truncada`);
    }
    
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      console.error(`❌ Estructura JSON inválida. Start: ${jsonStart}, End: ${jsonEnd}`);
      throw new Error('JSON incompleto o mal formado');
    }
    
    let jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
    console.log(`🔍 JSON extraído: ${jsonStr.substring(0, 200)}...`);
    
    // Sanitizar JSON: fix bad escape sequences comunes de Ollama
    jsonStr = sanitizeJsonString(jsonStr);
    
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (firstErr) {
      console.warn(`⚠️ JSON.parse falló (${firstErr}), intentando sanitización agresiva...`);
      // Sanitización agresiva: eliminar caracteres de control
      const aggressive = jsonStr.replace(/[\x00-\x1F\x7F]/g, (ch) => {
        if (ch === '\n') return '\\n';
        if (ch === '\r') return '\\r';
        if (ch === '\t') return '\\t';
        return '';
      });
      parsed = JSON.parse(aggressive);
      console.log('✅ JSON parseado tras sanitización agresiva');
    }
    
    // Validar estructura mínima
    if (!parsed.title || typeof parsed.title !== 'string') {
      console.error(`❌ Campo 'title' inválido o ausente: ${JSON.stringify(parsed.title)}`);
      throw new Error('JSON inválido: falta título');
    }
    if (!parsed.content || typeof parsed.content !== 'string') {
      console.warn(`⚠️ Campo 'content' ausente, usando placeholder`);
      parsed.content = '<p>Contenido generado por IA.</p>';
    }
    if (!parsed.tags || !Array.isArray(parsed.tags)) {
      console.warn(`⚠️ Campo 'tags' ausente o no es array, inicializando vacío`);
      parsed.tags = [];
    }
    if (!parsed.imagePrompt || typeof parsed.imagePrompt !== 'string') {
      console.warn(`⚠️ Campo 'imagePrompt' ausente, usando default`);
      parsed.imagePrompt = 'cryptocurrency, blockchain, digital assets';
    }
    if (!parsed.summary || typeof parsed.summary !== 'string') {
      console.warn(`⚠️ Campo 'summary' ausente, usando título como resumen`);
      parsed.summary = parsed.title;
    }

    // Validar/rellenar campos de fuentes cuando hay contexto de noticias
    if (hasRealNews) {
      if (!parsed.sourceUrl || typeof parsed.sourceUrl !== 'string') {
        console.warn(`⚠️ Campo 'sourceUrl' ausente, usando primera fuente del contexto`);
        parsed.sourceUrl = newsContext[0]?.link || '';
      }
      if (!parsed.sources || !Array.isArray(parsed.sources)) {
        console.warn(`⚠️ Campo 'sources' ausente, usando URLs del contexto`);
        parsed.sources = newsContext.map(n => n.link);
      }
    }
    
    return parsed as GeneratedArticle;
  } catch (error) {
    console.error(`❌ CRITICAL: Error parseando JSON de Gemini:`);
    console.error(`❌ Error: ${error}`);
    console.error(`❌ Raw response length: ${result.length} chars`);
    console.error(`❌ Raw response (first 1000 chars): ${result.substring(0, 1000)}${result.length > 1000 ? '...' : ''}`);
    
    // Intentar recuperación parcial con JSON incompleto o usando Regex
    try {
      // 1. Intentar buscar claves JSON estándar
      let titleMatch = result.match(/"title"\s*:\s*"([^"]+)"/);
      let summaryMatch = result.match(/"summary"\s*:\s*"([^"]+)"/);
      let contentMatch = result.match(/"content"\s*:\s*"([\s\S]*?)"(?=,\s*"|\s*})/);

      // 2. Si falla lo anterior, intentar buscar etiquetas "humanas" (Título:, Resumen:, etc.)
      if (!titleMatch) {
        const hTitle = result.match(/(?:\*\*|#)?\s*Título\s*:\s*(?:\*\*)?\s*([^\n]+)/i);
        if (hTitle) titleMatch = [null, hTitle[1]];
      }
      if (!summaryMatch) {
        const hSummary = result.match(/(?:\*\*|#)?\s*Resumen\s*:\s*(?:\*\*)?\s*([^\n]+)/i);
        if (hSummary) summaryMatch = [null, hSummary[1]];
      }
      if (!contentMatch) {
        const hContent = result.match(/(?:\*\*|#)?\s*Contenido\s*:\s*(?:\*\*)?\s*([\s\S]+)/i);
        if (hContent) contentMatch = [null, hContent[1]];
      }

      if (titleMatch && titleMatch[1]) {
        logWithTime(`🔄 Recuperado usando Regex (Formato: ${jsonStart === -1 ? 'Texto' : 'JSON Dañado'}): "${titleMatch[1].substring(0, 60)}"`);
        
        const cleanContent = (contentMatch ? contentMatch[1] : '')
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
          .trim();

        return {
          title: titleMatch[1].trim(),
          summary: summaryMatch ? summaryMatch[1].trim() : 'Resumen de la noticia',
          content: cleanContent.length > 50 ? cleanContent : '<p>Contenido recuperado de emergencia.</p>',
          imagePrompt: result.match(/imagePrompt"\s*:\s*"([^"]+)"/)?.[1] || 'cryptocurrency, blockchain',
          tags: [],
          sourceUrl: newsContext[0]?.link || '',
          sources: newsContext.map(n => n.link),
        };
      }
    } catch (recoveryError) {
      console.error(`❌ Falló recuperación parcial: ${recoveryError}`);
    }
    
    throw new Error('❌ Error crítico: Falló el parseo del JSON y la recuperación por Regex tras agotar intentos.');
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
  const esArticle = await generateArticleContent(recentTitles, newsContext);
  
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
  
  const systemPrompt = `You are a professional news journalist for the digital media "EmeDotEme", specializing in cryptocurrency, blockchain, and technology news.

IMPORTANT RULES:
1. Write ONLY in English. This is an English-language article.
2. Translate and adapt the Spanish content provided. Do NOT literally translate - write as a native English news piece.
3. The content must be informative, well-structured, and professional for an English-speaking audience.
4. NEVER invent data, figures, or statements not present in the source material.
5. Use English capitalization rules and grammar.
6. If there are multiple sources on the same topic, cross-reference for a more complete analysis.`;

  let avoidanceClause = '';
  if (esArticle.tags && esArticle.tags.length > 0) {
    avoidanceClause = `\n\nAVOID articles with these topics: ${esArticle.tags.join(', ')}.`;
  }

  let userPrompt: string;

  if (hasRealNews) {
    const newsText = formatNewsForPrompt(newsContext);
    
    userPrompt = `Below is a Spanish article that was written about verified news. Your task is to write an equivalent English version.

SPANISH ORIGINAL:
Title: ${esArticle.title}
Summary: ${esArticle.summary}
Content: ${esArticle.content}

INSTRUCTIONS:
- Title: Clear, attractive, in English (different from direct translation)
- Summary: 1-2 lines capturing the essence (in English)
- Content: HTML with p, h2, h3 tags. Make it LONG, DETAILED and professional like a leading digital newspaper (at least 5-6 substantial paragraphs). MUST include 2-3 secondary subheadings (h2 or h3) in the middle to break up the text.
- imagePrompt: Description in English for generating an illustrative image
- Use English news style and conventions
- ATENTION: NEVER use double quotes (") inside JSON string fields. Use single quotes (') for HTML attributes.

Return ONLY valid JSON: {titleEn, summaryEn, contentEn, imagePrompt}.${avoidanceClause}`;
  } else {
    userPrompt = `Translate and adapt this article for English readers.

SPANISH ORIGINAL:
Title: ${esArticle.title}
Summary: ${esArticle.summary}
Content: ${esArticle.content}

INSTRUCTIONS:
- Title: Clear, attractive, in English
- Summary: 1-2 lines in English
- Content: HTML with p, h2, h3 tags. LONG and DETAILED (at least 5-6 paragraphs). Include 2-3 subheadings.
- imagePrompt: English description for image
- Use English capitalization and grammar rules
- ATENTION: Use single quotes (') for HTML attributes, never double quotes (") in JSON.

Return ONLY valid JSON: {titleEn, summaryEn, contentEn, imagePrompt}.${avoidanceClause}`;
  }

  let result = await generateTextWithGemini({ systemPrompt, userPrompt, maxTokens: 6000, temperature: 0.7 });
  if (!result) {
    console.warn('⚠️ Gemini falló para EN, intentando con Ollama...');
    result = await generateTextWithOllama({ systemPrompt, userPrompt });
    if (!result) {
      throw new Error('❌ Error crítico: Falló la generación del contenido en inglés (Gemini y Ollama fallaron).');
    }
  }

  try {
    const cleaned = result.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) throw new Error('Invalid JSON structure');

    let jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
    
    // Sanitize JSON
    jsonStr = sanitizeJsonString(jsonStr);

    const parsed = JSON.parse(jsonStr);
    
    return {
      titleEn: parsed.titleEn || esArticle.title,
      summaryEn: parsed.summaryEn || esArticle.summary,
      contentEn: parsed.contentEn || esArticle.content
    };
  } catch (error) {
    console.error('❌ Error parsing English content:', error);
    
    // Intentar recuperación con regex
    try {
      const titleMatch = result.match(/"titleEn"\s*:\s*"([^"]+)"/);
      const summaryMatch = result.match(/"summaryEn"\s*:\s*"([^"]+)"/);
      let contentMatch = '';
      const contentRegex = /"contentEn"\s*:\s*"([\s\S]*?)",\s*"/;
      const cMatch = result.match(contentRegex);
      if (cMatch && cMatch[1]) {
        contentMatch = cMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }

      if (titleMatch && titleMatch[1]) {
        console.log('🔄 Recuperación EN exitosa por regex');
        return {
          titleEn: titleMatch[1],
          summaryEn: summaryMatch ? summaryMatch[1] : esArticle.summary,
          contentEn: contentMatch.length > 50 ? contentMatch : esArticle.content
        };
      }
    } catch (regexError) {
      console.error('❌ Falló recovery regex EN:', regexError);
    }
    
    // Fallback final: No permitir publicación sin traducción real
    throw new Error('❌ Error crítico: Falló el parseo de la versión en inglés y la recuperación por regex.');
  }
}

/**
 * Traduce el artículo generado al inglés (implementación mínima, solo copia los campos).
 * Personaliza para usar Gemini, OpenAI u otro servicio de traducción.
 */
export async function translateArticleContent(article: any) {
	// Implementación mínima: copia los campos y añade sufijo EN
	return {
		...article,
		titleEn: article.title + ' (EN)',
		summaryEn: article.summary + ' (EN)',
		contentEn: article.content + ' (EN)'
	};
}
