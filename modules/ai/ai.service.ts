import { generateTextWithGemini } from './gemini-text.service';
import type { NewsItem } from '../news/news-sources.service';
import { formatNewsForPrompt } from '../news/news-sources.service';

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

// --- Generación vía Ollama local (fallback) ---
async function generateTextWithOllama({ systemPrompt, userPrompt }: { systemPrompt: string; userPrompt: string; }): Promise<string | null> {
  try {
    const url = 'http://localhost:11434/api/generate';
    const model = process.env.OLLAMA_MODEL || 'qwen3.5:9b';
    const prompt = `${systemPrompt}\n\n${userPrompt}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 min timeout (600,000 ms)

    const fetchNode = (await import('node-fetch')).default;
    const response = await fetchNode(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false
      }),
      signal: controller.signal as any
    });
    
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.error('❌ Error HTTP desde Ollama:', response.status, await response.text());
      return null;
    }
    const data = (await response.json()) as any;
    if (!data || !data.response) {
      console.error('❌ Respuesta inesperada desde Ollama:', data);
      return null;
    }
    console.log('✅ Texto generado con Ollama:', data.response.substring(0, 100), '...');
    return data.response;
  } catch (err) {
    console.error('❌ Error llamando a Ollama:', err);
    return null;
  }
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
- Tags: 3-5 palabras clave sin '#', ej: ["Bitcoin", "ETF", "Mercado"]
- imagePrompt: descripción en inglés para generar una imagen ilustrativa
- sourceUrl: la URL de la fuente principal (la más relevante)
- sources: array con TODAS las URLs de las fuentes consultadas

EVITA: hashtags en el HTML, inventar datos no presentes en las fuentes, incluir enlaces o sección de fuentes en el contenido.
ATENCIÓN: Dado que la respuesta debe ser un JSON, NUNCA uses comillas dobles (") dentro del texto de los campos. Para el HTML, usa obligatoriamente comillas simples (ej: <h2 class='titulo'>) o escapa las comillas.

Devuelve SOLO JSON válido: {title, summary, content, imagePrompt, tags, sourceUrl, sources}.${avoidanceClause}`;
  } else {
    userPrompt = `Genera un artículo de noticias cripto en español.
- Título: claro y atractivo
- Resumen: 1-2 líneas
- Contenido: HTML con etiquetas p, h2, h3. El artículo DEBE SER LARGO, PROFUNDO Y DETALLADO. Extiéndete al menos 5 a 6 párrafos sustanciales. OBLIGATORIO: Intercala al menos 2 o 3 subtítulos secundarios (<h2> o <h3>) en medio del texto para dinamizar la lectura y dividir la introducción, desarrollo y conclusión técnica.
- Tags: 3-5 palabras clave sin '#', ej: ["Bitcoin", "ETF", "Mercado"]
- imagePrompt: descripción para generar imagen

EVITA: hashtags en HTML, temas recientes listados arriba, contenido repetitivo.
ATENCIÓN: Usa obligatoriamente comillas simples (') para cualquier atributo HTML. NO uses comillas dobles (") dentro de los campos para evitar romper el JSON.

Devuelve SOLO JSON válido: {title, summary, content, imagePrompt, tags}.${avoidanceClause}`;
  }
  
  let result = await generateTextWithGemini({ systemPrompt, userPrompt, maxTokens: 6000, temperature: 0.7 });
  if (!result) {
    console.warn('⚠️ Gemini falló, intentando con Ollama local...');
    result = await generateTextWithOllama({ systemPrompt, userPrompt });
    if (!result) {
      console.error('❌ Ollama también falló. Devolviendo ejemplo estático.');
      return {
        title: 'Artículo de ejemplo',
        summary: 'Resumen de ejemplo',
        content: '<p>Contenido de ejemplo generado por IA.</p>',
        imagePrompt: 'cryptocurrency, blockchain, digital assets',
        tags: [],
        sourceUrl: newsContext[0]?.link,
        sources: newsContext.map(n => n.link),
      };
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
    // 1. Reemplazar backslash seguido de carácter no válido en JSON  
    //    (válidos: " \ / b f n r t u)
    jsonStr = jsonStr.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
    // 2. Reemplazar saltos de línea literales dentro de strings JSON
    jsonStr = jsonStr.replace(/(?<=:\s*"[^"]*)\n/g, '\\n');
    jsonStr = jsonStr.replace(/(?<=:\s*"[^"]*)\r/g, '\\r');
    jsonStr = jsonStr.replace(/(?<=:\s*"[^"]*)\t/g, '\\t');
    
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
    
    console.log(`✅ JSON parseado correctamente: "${parsed.title.substring(0, 60)}..."`);
    console.log(`✅ Tags: ${JSON.stringify(parsed.tags)}`);
    console.log(`✅ Summary length: ${parsed.summary.length} chars`);
    console.log(`✅ Content length: ${parsed.content.length} chars`);
    if (parsed.sourceUrl) {
      console.log(`✅ Fuente principal: ${parsed.sourceUrl}`);
    }
    if (parsed.sources?.length) {
      console.log(`✅ Total fuentes citadas: ${parsed.sources.length}`);
    }
    
    return parsed as GeneratedArticle;
  } catch (error) {
    console.error(`❌ CRITICAL: Error parseando JSON de Gemini:`);
    console.error(`❌ Error: ${error}`);
    console.error(`❌ Raw response length: ${result.length} chars`);
    console.error(`❌ Raw response (first 1000 chars): ${result.substring(0, 1000)}${result.length > 1000 ? '...' : ''}`);
    
    // Intentar recuperación parcial con JSON incompleto o usando Regex
    try {
      const titleMatch = result.match(/"title"\s*:\s*"([^"]+)"/);
      const summaryMatch = result.match(/"summary"\s*:\s*"([^"]+)"/);
      
      // Para content es más complejo por los saltos de línea y el HTML
      // Buscamos todo lo que hay entre "content": " y el siguiente campo ", "imagePrompt" o "tags"
      let contentMatch = '';
      const contentRegex = /"content"\s*:\s*"([\s\S]*?)",\s*"/;
      const cMatch = result.match(contentRegex);
      if (cMatch && cMatch[1]) {
        contentMatch = cMatch[1];
      }

      if (titleMatch && titleMatch[1]) {
        console.log(`🔄 Recuperado usando Regex: "${titleMatch[1].substring(0,60)}"`);
        
        const cleanContent = contentMatch
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');

        return {
          title: titleMatch[1],
          summary: summaryMatch ? summaryMatch[1] : 'Resumen de la noticia',
          content: cleanContent.length > 50 ? cleanContent : '<p>Contenido recuperado de emergencia.</p>',
          imagePrompt: 'cryptocurrency, blockchain',
          tags: [],
          sourceUrl: newsContext[0]?.link || '',
          sources: newsContext.map(n => n.link),
        };
      }
    } catch (recoveryError) {
      console.error(`❌ Falló recuperación parcial: ${recoveryError}`);
    }
    
    return {
      title: 'Artículo de ejemplo',
      summary: 'Resumen de ejemplo',
      content: '<p>Contenido de ejemplo generado por IA.</p>',
      imagePrompt: 'cryptocurrency, blockchain, digital assets',
      tags: [],
      sourceUrl: newsContext[0]?.link,
      sources: newsContext.map(n => n.link),
    };
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
