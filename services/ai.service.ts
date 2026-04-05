import OpenAI from "openai";

import { getMarketData } from "./market.service";
import { getLatestNews } from "./news.service";
import { getPublishedArticles } from "./article.service";
import { generateTextWithGemini, isGeminiAvailable } from "./gemini-text.service";

/**
 * Debug helper to log character codes around a position
 */
function debugStringAtPosition(text: string, position: number, context = 20): void {
  console.error(`🔍 Debug JSON parsing at position ${position}:`);
  const start = Math.max(0, position - context);
  const end = Math.min(text.length, position + context);
  console.error(`   Surrounding text: "${text.substring(start, end)}"`);
  console.error(`   Character codes:`);
  for (let i = start; i < end; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);
    console.error(`     ${i}: '${char === '\n' ? '\\n' : char === '\r' ? '\\r' : char === '\t' ? '\\t' : char}' (${code})`);
  }
}

export interface GeneratedArticle {
  title: string;
  summary: string;
  content: string;
  tags?: string[];
  sourceImageUrl?: string;
  imageCaption?: string;
  sourceUrl?: string;
  sentiment?: string;
  titleEn?: string;
  summaryEn?: string;
  contentEn?: string;
  imagePrompt?: string;
}

/**
 * Limpia caracteres de control no escapados en un texto JSON
 */
function cleanControlCharacters(text: string): string {
  // Reemplaza caracteres de control (excepto tab, newline, carriage return escapados \t, \n, \r)
  // con espacios
  let result = '';
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (escapeNext) {
      result += char;
      escapeNext = false;
    } else if (char === '\\') {
      result += char;
      escapeNext = true;
    } else if (char === '"') {
      result += char;
      inString = !inString;
    } else if (inString && char.charCodeAt(0) < 32 && char !== '\t' && char !== '\n' && char !== '\r') {
      // Carácter de control dentro de string, reemplazar con espacio
      result += ' ';
    } else {
      result += char;
    }
  }
  
  return result;
}

/**
 * Intenta extraer y reparar un JSON que pueda venir con texto extra antes o después
 * También maneja JSONs truncados y mal formados
 */
function extractJsonFromText(text: string): string {
  try {
    // Limpiar caracteres de control primero
    text = cleanControlCharacters(text);
    
    // Buscar el primer { y el último }
    let start = text.indexOf('{');
    let end = text.lastIndexOf('}');
    
    if (start === -1 || end === -1 || end <= start) {
      return text;
    }
    
    let extracted = text.substring(start, end + 1);
    
    // Fix common JSON errors
    let fixed = extracted
      // Fix missing colon after property name
      .replace(/"\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*"/g, '"$1"')
      // Fix missing commas between properties
      .replace(/"\s*}\s*"/g, '","')
      .replace(/"\s*,\s*{/g, '",{')
      .replace(/}\s*"\s*:/g, '},"')
      // Fix unclosed strings
      .replace(/"([^"]*)$/g, '$1"')
      // Remove trailing commas before }
      .replace(/,\s*}/g, '}')
      // Fix missing quotes around keys
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
    
    // Si el JSON está truncado, intentar cerrar objetos
    const openBraces = (fixed.match(/{/g) || []).length;
    const closeBraces = (fixed.match(/}/g) || []).length;
    
    if (openBraces > closeBraces) {
      const missing = openBraces - closeBraces;
      for (let i = 0; i < missing; i++) {
        fixed += '}';
      }
    }
    
    return fixed;
  } catch (_e) {
    return text;
  }
}

/**
 * Intenta reparar un string JSON malformado
 */
function fixJsonString(jsonString: string): string {
  let fixed = jsonString;
  
  // FIRST: Remove ALL control characters (except tab, LF, CR which are valid in JSON)
  fixed = fixed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ');
  
  // Also clean Unicode control characters
  fixed = fixed.replace(/[\u0080-\u009F\u200B-\u200F\u2028-\u202F\uFEFF]/g, '');
  
  // QUITAR TRAILING COMMAS
  fixed = fixed.replace(/,\s*([}\]])/g, '$1');
  
  // AÑADIR ESPACIO DESPUÉS DE DOS PUNTOS si no lo hay (el problema principal)
  fixed = fixed.replace(/"([^"]+)":(?!\s)/g, '$1": ');  // "key":valor -> "key": valor
  
  // Fix comillas simples
  fixed = fixed.replace(/'([^']*)'/g, '"$1"');
  
  // Fix propiedades sin comillas
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  // Fix valores booleanos en minúsculas
  fixed = fixed.replace(/:\s*(true|false|null)(?!\w)/g, (match) => match.toLowerCase());
  
  // Fix valores numéricos que tengan comillas demás
  fixed = fixed.replace(/"(\d+)":/g, '$1:');
  
  // Quitar comas duplicadas
  fixed = fixed.replace(/,\s*,/g, ',');
  
  return fixed;
}

/**
 * Genera un artículo de noticias de fallback usando datos reales si es posible.
 */
async function getFallbackArticle(topic?: string): Promise<GeneratedArticle> {
  let marketContext = "";
  try {
    const marketData = await getMarketData();
    const topCoins = marketData.slice(0, 3);
    marketContext = topCoins.map(c => `${c.name} cotizando a $${c.current_price.toLocaleString()} (${c.price_change_percentage_24h.toFixed(2)}% en 24h)`).join(', ');
  } catch (_e) {
    marketContext = "Bitcoin, Ethereum y otros activos digitales clave experimentando alta volatilidad";
  }

  const titles = [
    "Análisis Urgente: El estado actual del mercado cripto",
    "Perspectiva de los mercados: ¿Qué está pasando con Bitcoin y las altcoins?",
    "Volatilidad en Web3: Entendiendo los movimientos recientes del mercado",
  ];
  
  const randomTitle = titles[Math.floor(Math.random() * titles.length)];

  return {
    title: topic ? `Especial: Análisis sobre ${topic.substring(0, 50)}...` : randomTitle,
    summary: `Nuestro equipo analiza la situación actual donde vemos a ${marketContext.split(',')[0]} liderando las métricas, proporcionando un contexto crucial para inversores.`,
    tags: ["Mercados", "Bitcoin", "Análisis"],
    content: `<p>En las últimas horas, el mercado de criptomonedas ha mostrado movimientos significativos que merecen un análisis profundo. Actualmente, observamos una dinámica donde destacan activos como ${marketContext}.</p>
<h2>Impacto de la Volatilidad</h2>
<p>La naturaleza del ecosistema Web3 implica fluctuaciones constantes. Sin embargo, los niveles actuales de soporte y resistencia sugieren que los inversores institucionales están recalibrando sus estrategias a corto y mediano plazo. Las métricas *on-chain* revelan acumulación en carteras significativas, lo que históricamente ha precedido a movimientos direccionales importantes.</p>
<h2>Perspectiva a Futuro</h2>
<p>Como analista, considero que la atención debe mantenerse no solo en la acción del precio de Bitcoin, sino en el desarrollo fundamental de redes secundarias. La verdadera adopción sigue construyéndose independientemente del ruido diario del mercado bursátil tradicional.</p>`,
    sourceImageUrl: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=1200&auto=format&fit=crop",
    imageCaption: "Gráficos de mercado y representación visual de la economía descentralizada.",
    sentiment: "Neutral ➡️",
  };
}

/**
 * Servicio de Inteligencia Artificial con RAG conectado a OLLAMA local.
 * 1. Obtiene datos reales del mercado (CoinGecko).
 * 2. Se los inyecta al modelo local como contexto.
 * 3. Devuelve un artículo periodístico estructurado en JSON.
 */
interface ArticleSummary {
  title: string;
  summary: string | null;
}

export async function generateWeeklyNewsletter(articles: ArticleSummary[]): Promise<{ subject: string, htmlContent: string }> {
  let ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
  
  if (process.env.OLLAMA_BASE_URL && !process.env.OLLAMA_BASE_URL.endsWith('/v1')) {
    const cleanUrl = process.env.OLLAMA_BASE_URL.replace(/\/$/, '');
    ollamaBaseUrl = `${cleanUrl}/v1`;
  }

  const modelName = process.env.OLLAMA_MODEL || "qwen3.5:27b";

  try {
    const openai = new OpenAI({
      baseURL: ollamaBaseUrl,
      apiKey: "ollama",
      defaultHeaders: {
        "ngrok-skip-browser-warning": "true"
      }
    });

    const articlesSummary = articles.map(a => `- ${a.title}: ${a.summary}`).join('\n\n');

    const systemPrompt = `Eres Carlos "Emérito" López Lovera, el editor jefe de EmeDotEme. 
Tu tarea es redactar la newsletter semanal oficial enviada por correo electrónico a tus suscriptores.
Tienes que resumir las noticias más importantes de la semana de una forma muy atractiva, conversacional, amigable pero profesional.

REGLAS ESTRICTAS:
1. El tono debe ser de "Hola inversor, aquí tienes lo más importante de la semana".
2. No uses fórmulas robóticas como "En resumen" o "En conclusión".
3. Escribe ÚNICAMENTE un objeto JSON con dos propiedades:
   - "subject": Un asunto de correo (Subject Line) muy llamativo (con 1 emoji).
   - "htmlContent": El contenido completo del correo en formato HTML, listo para enviar. 
     * Usa etiquetas <p>, <h2>, <ul>, <li>, <strong>, <br>.
     * Saluda al principio.
     * Despídete amablemente al final firmando como "El equipo de EmeDotEme".
     * NO uses las etiquetas <html> o <body>.
4. Escribe en Español de España.`;

    const userPrompt = `Aquí tienes los resúmenes de los artículos que hemos publicado esta semana:

${articlesSummary}

Redacta la newsletter semanal basándote en estos eventos. Trata de agruparlos lógicamente si puedes (ej. Regulación, Precios, Adopción).`;

    console.log(`🧠 Solicitando newsletter a Ollama (${modelName})...`);

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2500,
      stream: true,
    });

    let content = "";
    process.stdout.write("✍️ Generando newsletter... ");
    
    for await (const chunk of response) {
      const text = chunk.choices[0]?.delta?.content || "";
      content += text;
    }
    console.log("\n");
    
    if (!content) {
      throw new Error("Ollama devolvió una respuesta vacía al generar la newsletter.");
    }

    content = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    content = extractJsonFromText(content);

    const parsedNewsletter = JSON.parse(content);
    
    if (!parsedNewsletter.subject || !parsedNewsletter.htmlContent) {
      throw new Error("Estructura JSON incorrecta de la newsletter.");
    }

    return parsedNewsletter;

  } catch (error) {
    console.error("❌ Error generando newsletter con Ollama:", error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function translateArticleContent(article: GeneratedArticle): Promise<GeneratedArticle> {
  let ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
  
  if (process.env.OLLAMA_BASE_URL && !process.env.OLLAMA_BASE_URL.endsWith('/v1')) {
    const cleanUrl = process.env.OLLAMA_BASE_URL.replace(/\/$/, '');
    ollamaBaseUrl = `${cleanUrl}/v1`;
  }

  const modelName = "qwen2.5:14b";
  console.log(`🔄 Iniciando traducción al inglés...`);

  const systemPrompt = `You are an expert crypto and financial translator.
Your task is to perfectly translate a Spanish article into English.
Maintain the exact same tone, analytical style, and HTML formatting.

IMPORTANT: Return ONLY valid JSON.
- Use ONLY double quotes for strings.
- NO single quotes, NO backslash escapes unless absolutely necessary.
- NO special characters or control characters.
- NO markdown code blocks.

Return ONLY a valid JSON object with these exact properties:
1. "titleEn": The translated title - plain text, simple characters.
2. "summaryEn": The translated summary - plain text.
3. "contentEn": The translated HTML content. Keep all HTML tags exactly as they are. Translate the text inside. Maintain SEO links <a href="..."> exactly.

Example format:
{"titleEn":"Bitcoin Reaches New High","summaryEn":"Analysis of the latest price movement...","contentEn":"<p>Bitcoin has reached...","<h2>Key factors</h2>..."}`

  const userPrompt = `Please translate the following article to English:

TITLE:
${article.title}

SUMMARY:
${article.summary}

CONTENT:
${article.content}`;

  // Priority 1: Try Gemini Flash 2.5
  if (isGeminiAvailable()) {
    console.log('🌐 INTENTANDO TRADUCIR CON GEMINI FLASH 2.5...');
    
    const geminiResult = await generateTextWithGemini({
      systemPrompt,
      userPrompt,
      maxTokens: 6000,
      temperature: 0.3
    });
    
    if (geminiResult) {
      try {
        console.log(`📝 Traducción cruda de Gemini (${geminiResult.length} chars): ${geminiResult.substring(0, 150)}...`);
        let cleaned = geminiResult.replace(/```json\n?/g, '').replace(/```/g, '').trim();
        
        let parsed;
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          // Try to fix and parse
          const fixed = extractJsonFromText(cleaned);
          try {
            parsed = JSON.parse(fixed);
          } catch {
            // Last attempt with more aggressive fixes
            const aggressiveFixed = cleaned
              .replace(/,\s*}/g, '}')
              .replace(/,\s*]/g, ']')
              .replace(/"\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*":/g, '"$1":');
            parsed = JSON.parse(aggressiveFixed);
          }
        }
        
        if (parsed.titleEn && parsed.summaryEn && parsed.contentEn) {
          console.log('✅ Traducción completada con Gemini');
          return {
            ...article,
            titleEn: parsed.titleEn,
            summaryEn: parsed.summaryEn,
            contentEn: parsed.contentEn
          };
        } else {
          console.error('❌ JSON de traducción incompleto:', Object.keys(parsed));
        }
      } catch (parseError) {
        console.error('❌ Error parseando traducción de Gemini:', parseError);
      }
    } else {
      console.log('⚠️ Gemini retornó vacío, usando Ollama local...');
    }
  }



  // Priority 2: Fallback to Ollama
  console.log(`🌐 TRADUCIENDO CON OLLAMA LOCAL (${modelName})...`);

  try {
    const openai = new OpenAI({
      baseURL: ollamaBaseUrl,
      apiKey: "ollama",
      defaultHeaders: {
        "ngrok-skip-browser-warning": "true"
      }
    });
    
    console.log('✅ Conexión con Ollama establecida');

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2500,
      stream: true,
    });

    let content = "";
    process.stdout.write("✍️ Traduciendo... ");
    
    for await (const chunk of response) {
      const text = chunk.choices[0]?.delta?.content || "";
      content += text;
    }
    console.log("\n");
    
    if (!content) {
      throw new Error("Ollama devolvió una respuesta vacía en la traducción.");
    }

     content = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    content = cleanControlCharacters(content);
    content = extractJsonFromText(content);
    
    // Apply fixJsonString BEFORE parsing
    content = fixJsonString(content);

    let parsedTranslation;
    try {
        parsedTranslation = JSON.parse(content);
    } catch (parseError) {
        console.error("❌ Error parseando traducción de Ollama:", parseError);
        // Debug: log content length and character codes around error position
        console.error(`   Content length: ${content.length}`);
        // Try to extract position from error message
        const errorMsg = String(parseError);
        const positionMatch = errorMsg.match(/position (\d+)/);
        if (positionMatch) {
            const pos = parseInt(positionMatch[1], 10);
            debugStringAtPosition(content, pos);
        } else {
            // Default to middle of content
            debugStringAtPosition(content, Math.floor(content.length / 2));
        }
        const fixedContent = fixJsonString(content);
        try {
            parsedTranslation = JSON.parse(fixedContent);
            console.log("✅ JSON de traducción reparado");
        } catch {
            throw new Error("No se pudo parsear la traducción");
        }
    }
    
    return {
      ...article,
      titleEn: parsedTranslation.titleEn,
      summaryEn: parsedTranslation.summaryEn,
      contentEn: parsedTranslation.contentEn
    };

  } catch (error) {
    console.error("❌ Error traduciendo contenido con Ollama:", error instanceof Error ? error.message : error);
    return article;
  }
}

export async function generateArticleContent(topic?: string): Promise<GeneratedArticle> {
  let ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
  
  if (process.env.OLLAMA_BASE_URL && !process.env.OLLAMA_BASE_URL.endsWith('/v1')) {
    const cleanUrl = process.env.OLLAMA_BASE_URL.replace(/\/$/, '');
    ollamaBaseUrl = `${cleanUrl}/v1`;
  }

  const modelName = "qwen2.5:14b"; // Fallback local - using 2.5 for better JSON generation

  try {
    // RAG Parte 1: Obtener contexto real del mercado actual (precios)
    const marketData = await getMarketData();
    const topCoins = marketData.slice(0, 5);
    
    const marketContext = topCoins.map(coin => 
      `- ${coin.name} (${coin.symbol.toUpperCase()}): $${coin.current_price.toLocaleString()} (Cambio 24h: ${coin.price_change_percentage_24h.toFixed(2)}%)`
    ).join('\n');

    // RAG Parte 2: Obtener noticias del mundo real
    const latestNews = await getLatestNews();
    
    const newsContext = latestNews.length > 0 
      ? latestNews.map(n => `- [${n.source}] ${n.title}`).join('\n')
      : "No hay noticias de última hora disponibles.";

    // RAG Parte 3: Evitar repetición
    const recentArticles = await getPublishedArticles(50);
    const recentTitles = recentArticles.map(a => a.title).join(' | ');
    const usedSourceUrls = new Set(recentArticles.map(a => a.sourceUrl).filter(Boolean));
    const usedImageUrls = new Set(recentArticles.map(a => a.imageUrl).filter(Boolean));

    let specificFocus = topic;
    let selectedImageUrl: string | undefined = undefined;
    let selectedSourceUrl: string | undefined = undefined;

    if (!specificFocus && latestNews.length > 0) {
      const availableNews = latestNews.filter(n => {
        const urlUsada = usedSourceUrls.has(n.link);
        const imagenUsada = n.imageUrl ? usedImageUrls.has(n.imageUrl) : false;
        return !urlUsada && !imagenUsada;
      });

      if (availableNews.length > 0) {
        const randomNews = availableNews[Math.floor(Math.random() * availableNews.length)];
        specificFocus = `Enfócate detalladamente en esta noticia específica: "${randomNews.title}" (Fuente: ${randomNews.source}). Úsala como núcleo central de tu artículo, y usa los precios de CoinGecko o el resto de titulares como contexto secundario.`;
        selectedImageUrl = randomNews.imageUrl;
        selectedSourceUrl = randomNews.link;
      } else {
        console.warn("⚠️ Advertencia: Todas las noticias recientes ya han sido procesadas. Se usará un artículo general de mercado.");
      }
    }

    const systemPrompt = `Eres Carlos "Emérito" López Lovera, un prestigioso periodista humano y analista senior en mercados institucionales y tecnología Web3 para el portal financiero 'EmeDotEme'.
Tu tarea es escribir un artículo analítico, frío, objetivo y PROFUNDAMENTE DETALLADO que relacione los datos del mercado en vivo con los eventos recientes.

REGLAS ESTRICTAS DE TONO Y ESTILO:
1. PROHIBIDO usar frases clichés de IA como "En conclusión", "En resumen", "El mundo de las criptomonedas", "El mercado cripto está en vilo", etc.
2. Mantén un tono frío, analítico y directo, similar a Bloomberg/WSJ.
3. INVENTA citas plausibles o menciona firmas de análisis reales (Glassnode, CoinGlass, JPMorgan).
4. NO cometas errores matemáticos.
5. NUNCA traduzcas literalmente del inglés: "El fundador de Telegram" ✅, "Telegram Fundador" ❌

IMPORTANTE sobre formato JSON:
- NO uses caracteres especiales raros, emojis dentro de strings JSON, ni ningún carácter de control.
- NO uses comillas simples para delimitar strings - usa solo comillas dobles.
- NO uses barras invertidas innecesarias.
- En el campo "content" (HTML), usa solo etiquetas básicas: <p>, <h2>, <strong>, <a href="/tag/xxx">.
- El campo "tags" debe ser un array de strings simples, sin HTML.
- Los campos "title", "summary", "imageCaption" deben ser texto plano simple, sin caracteres especiales raros.

REGLAS PARA IMAGEN (imagePrompt):
1. El "imagePrompt" debe ser un prompt en INGLÉS para generar una imagen profesional relacionada con el artículo.
2. DEBE ser 100% Safe For Work (SFW): nada de desnudez, violencia, contenido sexual o perturbador.
3. Enfócate en conceptos financieros, gráficos, datos, tecnología, abstractos o metafóricos.
4. Ejemplos buenos: "A detailed financial chart showing Bitcoin price movements with analytical indicators", "Conceptual illustration of blockchain technology as interconnected digital nodes", "Professional business graphic representing market volatility".
5. Evita descripciones de personas a menos que sea estrictamente necesario; si incluyes personas, deben ser profesionales en entorno laboral.
6. Añade al final: "professional illustration, clean, business aesthetic, safe for work".

REGLAS DE FORMATO:
1. Devuelve ÚNICAMENTE JSON con: "title", "summary", "content", "tags", "imageCaption", "sentiment", "imagePrompt".
2. "title": Sentence case, NO Title Case.
3. "content": Mínimo 500-600 palabras en HTML con <p> y <h2>.
4. "sentiment": "Alcista ⬆️", "Bajista ⬇️" o "Neutral ➡️".
5. Empieza con { y termina con }. Sin markdown.
6. SEO: Usa <a href="/tag/bitcoin">Bitcoin</a>.`;

    const userPrompt = `PRECIOS EN VIVO:
${marketContext}

TITULARES:
${newsContext}

${specificFocus || 'Elige la noticia más relevante sobre mercados.'}

ESCRIBE EN ESPAÑOL, formato JSON.`;

    // Priority 1: Try Gemini Flash 2.5
    if (isGeminiAvailable()) {
      console.log('🎯 INTENTANDO GENERAR CON GEMINI FLASH 2.5...');
      
      const geminiResult = await generateTextWithGemini({
        systemPrompt,
        userPrompt,
        maxTokens: 6000,
        temperature: 0.7
      });
      
       if (geminiResult) {
        try {
          console.log(`📝 Respuesta cruda de Gemini (${geminiResult.length} chars)`);
          let cleaned = geminiResult.replace(/```json\n?/g, '').replace(/```/g, '').trim();
          
          let parsedArticle: GeneratedArticle | null = null;
          let parseSuccess = false;
          
          // Strategy 1: Direct parse
          try {
            parsedArticle = JSON.parse(cleaned) as GeneratedArticle;
            parseSuccess = true;
            console.log('✅ Parseado con estrategia directa');
          } catch {
            console.log('⚠️ Estrategia directa falló, intentando siguiente...');
          }
          
          // Strategy 2: Extract and fix
          if (!parseSuccess) {
            try {
              parsedArticle = JSON.parse(extractJsonFromText(cleaned)) as GeneratedArticle;
              parseSuccess = true;
              console.log('✅ Parseado con extracción');
            } catch {
              console.log('⚠️ Extracción falló, intentando siguiente...');
            }
          }
          
          // Strategy 3: Aggressive fix
          if (!parseSuccess) {
            try {
              const aggressive = cleaned
                .replace(/,\s*}/g, '}')
                .replace(/,\s*]/g, ']')
                .replace(/"([^"]*)$/g, '$1"')
                .replace(/\}\s*$/g, '}');
              parsedArticle = JSON.parse(extractJsonFromText(aggressive)) as GeneratedArticle;
              parseSuccess = true;
              console.log('✅ Parseado con fix agresivo');
            } catch {
              console.log('⚠️ Fix agresivo falló, intentando siguiente...');
            }
          }
          
          // Strategy 4: Find valid JSON subset
          if (!parseSuccess) {
            try {
              const jsonMatch = cleaned.match(/\{[\s\S]*"tags":\s*\[[\s\S]*\][\s\S]*\}/);
              if (jsonMatch) {
                parsedArticle = JSON.parse(jsonMatch[0]) as GeneratedArticle;
                parseSuccess = true;
                console.log('✅ Parseado con subset JSON');
              }
            } catch {
              console.log('⚠️ Subset falló...');
            }
          }
          
          if (parseSuccess && parsedArticle && parsedArticle.title && parsedArticle.summary && parsedArticle.content) {
            if (selectedImageUrl) parsedArticle.sourceImageUrl = selectedImageUrl;
            if (selectedSourceUrl) parsedArticle.sourceUrl = selectedSourceUrl;
            
            console.log(`✅ Artículo generado por Gemini: ${parsedArticle.title}`);
            return parsedArticle;
          } else {
            console.error('❌ JSON de Gemini incompleto o no se pudo parsear');
          }
        } catch (parseError) {
          console.error('❌ Error parseando respuesta de Gemini:', parseError);
        }
      } else {
        console.log('⚠️ Gemini retornó vacío, usando Ollama local...');
      }
    } else {
      console.log('⚠️ Gemini no disponible, usando Ollama local...');
    }



    // Priority 2: Fallback to Ollama local
    console.log(`🧠 Generando con Ollama local (${modelName})...`);

    const openai = new OpenAI({
      baseURL: ollamaBaseUrl,
      apiKey: "ollama",
      defaultHeaders: { "ngrok-skip-browser-warning": "true" }
    });

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2500,
      stream: true,
    });

    let content = "";
    process.stdout.write("✍️ Generando artículo... ");
    
    for await (const chunk of response) {
      const text = chunk.choices[0]?.delta?.content || "";
      content += text;
    }
    console.log("\n");
    
    if (!content) {
      throw new Error("Ollama devolvió una respuesta vacía.");
    }

    content = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    content = cleanControlCharacters(content);
    content = extractJsonFromText(content);
    
    // FIRST clean: Remove ALL control characters aggressively
    content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ');
    content = content.replace(/[\u0080-\u009F\u200B-\u200F\u2028-\u202F\uFEFF]/g, '');
    
    // Apply fixJsonString BEFORE parsing to clean problematic chars first
    content = fixJsonString(content);

     let parsedArticle: GeneratedArticle;
    try {
        parsedArticle = JSON.parse(content) as GeneratedArticle;
    } catch (parseError) {
        console.error("❌ Error parsing JSON de Ollama:", parseError);
        // Debug: log content length and character codes around error position
        console.error(`   Content length: ${content.length}`);
        // Try to extract position from error message
        const errorMsg = String(parseError);
        const positionMatch = errorMsg.match(/position (\d+)/);
        if (positionMatch) {
            const pos = parseInt(positionMatch[1], 10);
            debugStringAtPosition(content, pos);
        } else {
            // Default to middle of content
            debugStringAtPosition(content, Math.floor(content.length / 2));
        }
        // Second attempt with more aggressive repair
        let aggressiveContent = content
            .replace(/[\x00-\x1F\x7F]/g, ' ')  // Remove all control chars
            .replace(/,\s*([}\]])/g, '$1')     // Remove trailing commas
            .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')  // Quote properties
            .replace(/"(\d+)":/g, '$1:');      // Unquote numbers
        
        try {
            parsedArticle = JSON.parse(aggressiveContent) as GeneratedArticle;
            console.log("✅ JSON reparado con estrategia agresiva");
        } catch {
            // Third attempt: extract just the keys we need
            try {
                const titleMatch = content.match(/"title"\s*:\s*"([^"]+)"/);
                const summaryMatch = content.match(/"summary"\s*:\s*"([^"]+)"/);
                const contentMatch = content.match(/"content"\s*:\s*"([\s\S]*?)"\s*,?\s*"/);
                
                if (titleMatch && summaryMatch) {
                    parsedArticle = {
                        title: titleMatch[1],
                        summary: summaryMatch[1],
                        content: contentMatch ? contentMatch[1] : "<p>Content not available</p>",
                        tags: [],
                        sentiment: "Neutral ➡️"
                    };
                    console.log("✅ JSON reconstruido manualmente");
                } else {
                    throw new Error("No se pudo parsear");
                }
            } catch {
                throw new Error(`JSON inválido: no se pudo parsear ni reparar`);
            }
        }
    }
    
    // Eliminar conclusiones de IA
    const clicheRegex = /<p>\s*(\*\*|<b>)?\s*(En conclusi[oó]n|En resumen|Para concluir|Para resumir)[,.:\s]*(?:\*\*|<\/b>)?\s*(.*?)/gi;
    parsedArticle.content = parsedArticle.content.replace(clicheRegex, (match, p1, p2, p3) => {
      if (p3) {
        const capitalizedText = p3.charAt(0).toUpperCase() + p3.slice(1);
        return `<p>${capitalizedText}`;
      }
      return '<p>';
    });

    if (!parsedArticle.title || !parsedArticle.summary || !parsedArticle.content) {
      throw new Error("El JSON devuelto no tiene la estructura correcta.");
    }

    if (selectedImageUrl) parsedArticle.sourceImageUrl = selectedImageUrl;
    if (selectedSourceUrl) parsedArticle.sourceUrl = selectedSourceUrl;

    console.log(`✅ Artículo generado con éxito por Ollama: ${parsedArticle.title}`);
    return parsedArticle;

  } catch (error) {
    console.error("❌ Error generando contenido:", error instanceof Error ? error.message : error);
    return await getFallbackArticle(topic);
  }
}