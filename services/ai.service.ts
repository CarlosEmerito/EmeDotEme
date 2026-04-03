import OpenAI from "openai";
import { getMarketData } from "./market.service";
import { getLatestNews } from "./news.service";
import { getPublishedArticles } from "./article.service";

export interface GeneratedArticle {
  title: string;
  summary: string;
  content: string;
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
    "Inteligencia Artificial y Blockchain: La nueva frontera",
  ];
  
  const randomTitle = titles[Math.floor(Math.random() * titles.length)];

  return {
    title: topic ? `Especial: ${topic} en el radar` : randomTitle,
    summary: "La inteligencia artificial de EmeDotEme ha analizado los últimos movimientos del mercado y reporta hallazgos significativos en este sector.",
    content: "<p>Este es el contenido completo del artículo generado automáticamente. En un entorno de producción, este texto extenso sería redactado por un LLM tras analizar fuentes de datos en tiempo real.</p><p>Analizamos las tendencias, el volumen de operaciones y el sentimiento general del mercado para brindarte esta información de vanguardia. La integración de IA permite una cobertura 24/7 sin precedentes.</p>",
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
    const recentArticles = await getPublishedArticles(5);
    const recentTitles = recentArticles.map(a => a.title).join(' | ');

    // Estrategia de Variedad: Si no hay un tema específico, escogemos una o dos noticias al azar para enfocar el artículo
    let specificFocus = topic;
    if (!specificFocus && latestNews.length > 0) {
      // Cogemos 1 noticia principal al azar de los RSS para no repetir siempre el mismo resumen
      const randomNews = latestNews[Math.floor(Math.random() * latestNews.length)];
      specificFocus = `Enfócate detalladamente en esta noticia específica: "${randomNews.title}" (Fuente: ${randomNews.source}). Úsala como núcleo central de tu artículo, y usa los precios de CoinGecko o el resto de titulares como contexto secundario.`;
    }

    const systemPrompt = `Eres un periodista experto en criptomonedas, economía global y tecnología Web3 para el portal de noticias 'EmeDotEme'.
Tu tarea es escribir un artículo atractivo, analítico y profesional que relacione los precios del mercado en vivo con los eventos, noticias y regulaciones globales recientes.

REGLAS ESTRICTAS:
1. Devuelve ÚNICAMENTE un objeto JSON válido con las siguientes 3 propiedades exactas: "title", "summary", "content".
2. "title": Un titular original, periodístico, llamativo y que capte las tendencias recientes.
3. "summary": Un breve resumen (sin etiquetas HTML) explicando la noticia.
4. "content": Un artículo completo, profesional y largo en formato HTML. 
   - Debe tener al menos 4 párrafos analizando en profundidad.
   - Usa etiquetas como <p>, <h2> para subtítulos clave, y <strong> para destacar números.
   - NO uses etiquetas <html>, <body> o <h1>.
5. El tono debe ser formal, similar a Bloomberg o CoinDesk.
6. NO ESCRIBAS SOBRE ESTOS TEMAS RECIENTES (para evitar ser repetitivo): ${recentTitles || "Ninguno"}.
7. Genera el JSON en formato crudo.`;

    const userPrompt = `Aquí tienes los datos actuales y reales del mercado en este mismo instante:

PRECIOS EN VIVO (TOP 5):
${marketContext}

TITULARES DE NOTICIAS DE ÚLTIMA HORA:
${newsContext}

${specificFocus ? specificFocus : `Elige el titular más interesante y escribe un artículo.`}`;

    console.log(`🧠 Solicitando generación a Ollama (${modelName})...`);

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
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

    console.log(`✅ Artículo generado con éxito por Ollama: ${parsedArticle.title}`);
    return parsedArticle;

  } catch (error) {
    console.error("❌ Error generando contenido con Ollama:", error);
    return getMockArticle(topic); // Fallback en caso de que Ollama esté apagado
  }
}