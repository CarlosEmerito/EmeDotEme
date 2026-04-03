import OpenAI from "openai";
import { getMarketData } from "./market.service";
import { getLatestNews } from "./news.service";
import { getPublishedArticles } from "./article.service";

export interface GeneratedArticle {
  title: string;
  summary: string;
  content: string;
  sourceImageUrl?: string;
  imageCaption?: string;
}

/**
 * Intenta extraer y reparar un JSON que pueda venir con texto extra antes o después
 */
function extractJsonFromText(text: string): string {
  try {
    // Buscar el primer { y el último }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start !== -1 && end !== -1 && end > start) {
      return text.substring(start, end + 1);
    }
    return text;
  } catch (e) {
    return text;
  }
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
  } catch (e) {
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
    content: `<p>En las últimas horas, el mercado de criptomonedas ha mostrado movimientos significativos que merecen un análisis profundo. Actualmente, observamos una dinámica donde destacan activos como ${marketContext}.</p>
<h2>Impacto de la Volatilidad</h2>
<p>La naturaleza del ecosistema Web3 implica fluctuaciones constantes. Sin embargo, los niveles actuales de soporte y resistencia sugieren que los inversores institucionales están recalibrando sus estrategias a corto y mediano plazo. Las métricas *on-chain* revelan acumulación en carteras significativas, lo que históricamente ha precedido a movimientos direccionales importantes.</p>
<h2>Perspectiva a Futuro</h2>
<p>Como analista, considero que la atención debe mantenerse no solo en la acción del precio de Bitcoin, sino en el desarrollo fundamental de redes secundarias. La verdadera adopción sigue construyéndose independientemente del ruido diario del mercado bursátil tradicional.</p>`,
    sourceImageUrl: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=1200&auto=format&fit=crop",
    imageCaption: "Gráficos de mercado y representación visual de la economía descentralizada.",
  };
}

/**
 * Servicio de Inteligencia Artificial con RAG conectado a OLLAMA local.
 * 1. Obtiene datos reales del mercado (CoinGecko).
 * 2. Se los inyecta al modelo local como contexto.
 * 3. Devuelve un artículo periodístico estructurado en JSON.
 */
export async function generateArticleContent(topic?: string): Promise<GeneratedArticle> {
  // Configuración para usar Ollama local a través del SDK de OpenAI
  let ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
  
  // Asegurarnos de que la URL termine en /v1 para compatibilidad con la API de OpenAI
  if (process.env.OLLAMA_BASE_URL && !process.env.OLLAMA_BASE_URL.endsWith('/v1')) {
    // Limpiar posible barra final
    const cleanUrl = process.env.OLLAMA_BASE_URL.replace(/\/$/, '');
    ollamaBaseUrl = `${cleanUrl}/v1`;
  }

  const modelName = process.env.OLLAMA_MODEL || "llama3.1"; // Usaremos llama3.1 (excelente para tu hardware)

  try {
    const openai = new OpenAI({
      baseURL: ollamaBaseUrl,
      apiKey: "ollama", // El SDK requiere una key, pero Ollama la ignora
      defaultHeaders: {
        // MUY IMPORTANTE: Ngrok bloquea las peticiones automáticas con una pantalla de advertencia en cuentas gratuitas.
        // Este header le dice a Ngrok que deje pasar la petición directamente a nuestro Ollama.
        "ngrok-skip-browser-warning": "true"
      }
    });
    
    // RAG Parte 1: Obtener contexto real del mercado actual (precios)
    const marketData = await getMarketData();
    const topCoins = marketData.slice(0, 5);
    
    const marketContext = topCoins.map(coin => 
      `- ${coin.name} (${coin.symbol.toUpperCase()}): $${coin.current_price.toLocaleString()} (Cambio 24h: ${coin.price_change_percentage_24h.toFixed(2)}%)`
    ).join('\n');

    // RAG Parte 2: Obtener noticias del mundo real (Cripto, Finanzas, Regulaciones)
    const latestNews = await getLatestNews();
    
    const newsContext = latestNews.length > 0 
      ? latestNews.map(n => `- [${n.source}] ${n.title}`).join('\n')
      : "No hay noticias de última hora disponibles.";

    // RAG Parte 3: Evitar repetición (obtenemos últimos artículos publicados)
    const recentArticles = await getPublishedArticles(15);
    const recentTitles = recentArticles.map(a => a.title).join(' | ');

    // Estrategia de Variedad: Si no hay un tema específico, escogemos una o dos noticias al azar para enfocar el artículo
    let specificFocus = topic;
    let selectedImageUrl: string | undefined = undefined;

    if (!specificFocus && latestNews.length > 0) {
      // Cogemos 1 noticia principal al azar de los RSS para no repetir siempre el mismo resumen
      const randomNews = latestNews[Math.floor(Math.random() * latestNews.length)];
      specificFocus = `Enfócate detalladamente en esta noticia específica: "${randomNews.title}" (Fuente: ${randomNews.source}). Úsala como núcleo central de tu artículo, y usa los precios de CoinGecko o el resto de titulares como contexto secundario.`;
      selectedImageUrl = randomNews.imageUrl;
    }

    const systemPrompt = `Eres Carlos "Emérito" López Lovera, un prestigioso periodista humano y experto en criptomonedas, economía global y tecnología Web3 para el portal de noticias 'EmeDotEme'.
Tu tarea es escribir un artículo atractivo, analítico y PROFUNDAMENTE DETALLADO que relacione los precios del mercado en vivo con los eventos, noticias y regulaciones globales recientes.

REGLAS ESTRICTAS DE FORMATO Y LONGITUD:
1. Devuelve ÚNICAMENTE un objeto JSON válido con las siguientes 4 propiedades exactas: "title", "summary", "content", "imageCaption".
2. "title": Un titular original, periodístico, llamativo y que capte las tendencias recientes.
3. "summary": Un breve resumen (sin etiquetas HTML) explicando la noticia.
4. "content": Un artículo MUY EXTENSO y profesional en formato HTML. 
   - ES OBLIGATORIO que el artículo tenga al menos 600 palabras y entre 6 y 8 párrafos bien desarrollados.
   - DEBES incluir múltiples secciones utilizando etiquetas <h2> para los subtítulos. Estructura recomendada: Introducción, Análisis de la Noticia Principal, Contexto del Mercado (usando los precios proporcionados), Implicaciones a Futuro y Conclusión.
   - Usa etiquetas como <p>, <h2> y <strong>. NO uses etiquetas <html>, <body> o <h1>.
5. "imageCaption": Escribe un pie de foto (máximo 1 o 2 oraciones) periodístico que sirva como acompañamiento temático al artículo. IMPORTANTE: Como no puedes ver la imagen real que acompañará al artículo, NUNCA describas elementos visuales (no digas "En la foto se ve...", "Gráfico de...", "Representación de...", etc.). Simplemente escribe una frase de contexto reflexiva o un dato clave relacionado con el titular.
6. El tono debe ser formal, humano y experto, similar a Bloomberg o CoinDesk. NUNCA menciones que eres una IA, un bot o un asistente virtual. Escribe como si fueras un analista de carne y hueso.
7. NO ESCRIBAS SOBRE ESTOS TEMAS RECIENTES (para evitar ser repetitivo): ${recentTitles || "Ninguno"}.
8. TEMA EXCLUSIVO: Tu artículo DEBE ser estricta y exclusivamente sobre criptomonedas, blockchain, Bitcoin, Ethereum, Web3, DeFi o el mercado de criptoactivos.
9. MUY IMPORTANTE: NO devuelvas texto conversacional antes o después del JSON. Empieza con { y termina con }. NO uses markdown de bloques de código como \`\`\`json. Tu salida debe ser analizable directamente por JSON.parse().`;

    const userPrompt = `Aquí tienes los datos actuales y reales del mercado en este mismo instante:

PRECIOS EN VIVO (TOP 5):
${marketContext}

TITULARES DE NOTICIAS DE ÚLTIMA HORA:
${newsContext}

${specificFocus ? specificFocus : `Elige el titular más interesante sobre CRIPTOMONEDAS y escribe un artículo.`}

RECUERDA: Tu artículo debe ser LARGO, DETALLADO y 100% ENFOCADO EN EL ECOSISTEMA CRIPTO. No escribas solo un par de párrafos. Analiza las causas, incluye los precios de CoinGecko, y da una opinión analítica profunda como un verdadero experto humano del mercado criptográfico.`;

    console.log(`🧠 Solicitando generación a Ollama (${modelName})...`);

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2500,
    });

    let content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error("Ollama devolvió una respuesta vacía.");
    }

    // Limpieza y extracción robusta del JSON
    content = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    content = extractJsonFromText(content);

    const parsedArticle = JSON.parse(content) as GeneratedArticle;
    
    // Validación básica de la estructura del JSON
    if (!parsedArticle.title || !parsedArticle.summary || !parsedArticle.content) {
      throw new Error("El JSON devuelto por Ollama no tiene la estructura correcta.");
    }

    if (selectedImageUrl) {
      parsedArticle.sourceImageUrl = selectedImageUrl;
    }

    console.log(`✅ Artículo generado con éxito por Ollama: ${parsedArticle.title}`);
    return parsedArticle;

  } catch (error) {
    console.error("❌ Error generando contenido con Ollama:", error);
    return await getFallbackArticle(topic); // Fallback dinámico si la IA local falla
  }
}