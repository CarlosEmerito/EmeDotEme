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
 * Genera un artículo de noticias falso si no hay conexión con la IA,
 * asegurando que el sitio nunca se rompa.
 */
function getMockArticle(topic?: string): GeneratedArticle {
  const titles = [
    "Bitcoin rompe la barrera de los $100K: Análisis del mercado",
    "Ethereum lanza una nueva propuesta de mejora (EIP)",
    "Solana procesa un millón de transacciones por segundo en pruebas",
    "Nuevo marco regulatorio en la Unión Europea para criptoactivos",
    "La adopción institucional de DeFi alcanza máximos históricos",
    "Web3 y Finanzas Tradicionales: La nueva frontera",
  ];
  
  const randomTitle = titles[Math.floor(Math.random() * titles.length)];

  return {
    title: topic ? `Especial: ${topic} en el radar` : randomTitle,
    summary: "Nuestro equipo de analistas de EmeDotEme ha evaluado los últimos movimientos del mercado y reporta hallazgos significativos en este sector.",
    content: "<p>Este es el contenido completo del artículo generado para reportar la situación actual. En este texto extenso analizamos las tendencias recientes y su impacto en el ecosistema financiero.</p><p>Analizamos las tendencias, el volumen de operaciones y el sentimiento general del mercado para brindarte esta información de vanguardia y una cobertura completa del panorama cripto actual.</p>",
    sourceImageUrl: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=1200&auto=format&fit=crop", // Placeholder image
    imageCaption: "Representación visual de la tecnología blockchain y los mercados digitales emergentes.",
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
5. "imageCaption": Escribe un pie de foto (máximo 1 o 2 oraciones) periodístico y profesional que describa la temática general de la imagen que acompañará este artículo.
6. El tono debe ser formal, humano y experto, similar a Bloomberg o CoinDesk. NUNCA menciones que eres una IA, un bot o un asistente virtual. Escribe como si fueras un analista de carne y hueso.
7. NO ESCRIBAS SOBRE ESTOS TEMAS RECIENTES (para evitar ser repetitivo): ${recentTitles || "Ninguno"}.
8. Genera el JSON en formato crudo sin formato markdown como \`\`\`json.`;

    const userPrompt = `Aquí tienes los datos actuales y reales del mercado en este mismo instante:

PRECIOS EN VIVO (TOP 5):
${marketContext}

TITULARES DE NOTICIAS DE ÚLTIMA HORA:
${newsContext}

${specificFocus ? specificFocus : `Elige el titular más interesante y escribe un artículo.`}

RECUERDA: Tu artículo debe ser LARGO y DETALLADO. No escribas solo un par de párrafos. Analiza las causas, los efectos en los precios de CoinGecko proporcionados y da una opinión analítica profunda como un verdadero experto.`;

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

    // Limpieza de formato en caso de que el LLM local devuelva bloques markdown ```json
    content = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();

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
    return getMockArticle(topic); // Fallback en caso de que Ollama esté apagado
  }
}