import OpenAI from "openai";
import { getMarketData } from "./market.service";

export interface GeneratedArticle {
  title: string;
  summary: string;
  content: string;
}

/**
 * Genera un artículo de noticias falso si no hay clave de API configurada,
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
 * Servicio de Inteligencia Artificial con RAG (Retrieval-Augmented Generation).
 * 1. Obtiene datos reales del mercado (CoinGecko).
 * 2. Se los inyecta al LLM (OpenAI) como contexto.
 * 3. Devuelve un artículo periodístico estructurado en JSON.
 */
export async function generateArticleContent(topic?: string): Promise<GeneratedArticle> {
  const apiKey = process.env.OPENAI_API_KEY;

  // Fallback si el usuario aún no ha configurado su clave de OpenAI en Vercel
  if (!apiKey) {
    console.warn("⚠️ No se encontró OPENAI_API_KEY. Devolviendo artículo de prueba (Mock).");
    return getMockArticle(topic);
  }

  try {
    const openai = new OpenAI({ apiKey });
    
    // RAG: Obtener contexto real del mercado actual
    const marketData = await getMarketData();
    const topCoins = marketData.slice(0, 5); // Tomamos el Top 5 para darle contexto a la IA
    
    const marketContext = topCoins.map(coin => 
      `- ${coin.name} (${coin.symbol.toUpperCase()}): $${coin.current_price.toLocaleString()} (Cambio 24h: ${coin.price_change_percentage_24h.toFixed(2)}%)`
    ).join('\n');

    const systemPrompt = `Eres un periodista experto en criptomonedas, economía y tecnología Web3 para el portal 'EmeDotEme'.
Tu tarea es escribir un artículo de noticias atractivo, profesional, imparcial y optimizado para SEO basado en el estado actual del mercado o en el tema proporcionado por el usuario.

REGLAS ESTRICTAS:
1. Devuelve ÚNICAMENTE un objeto JSON válido con las siguientes 3 propiedades exactas: "title", "summary", "content".
2. "title": Un titular llamativo y periodístico (máximo 80 caracteres).
3. "summary": Un resumen de 2 líneas para la portada (sin formato HTML).
4. "content": El cuerpo completo del artículo en formato HTML. 
   - Debe tener al menos 3 párrafos bien estructurados.
   - Usa etiquetas como <p>, <h2> para subtítulos, <ul> y <li> para listas, y <strong> para resaltar datos clave.
   - NO uses etiquetas <html>, <body> o <h1> (ya que el frontend ya las pone por ti).
5. Mantén un tono formal y analítico.`;

    const userPrompt = `Aquí tienes los datos actuales y reales del mercado (Top 5 criptomonedas en vivo):\n${marketContext}\n\n${topic ? `El tema principal o evento específico de este artículo debe ser: "${topic}". Relaciónalo con el estado del mercado si es posible.` : `Por favor, escribe una actualización general del mercado y análisis de tendencias basándote en estos datos en vivo.`}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Usamos el modelo más rápido y económico para redacción de textos
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error("OpenAI devolvió una respuesta vacía.");
    }

    const parsedArticle = JSON.parse(content) as GeneratedArticle;
    
    // Validación básica de la estructura del JSON
    if (!parsedArticle.title || !parsedArticle.summary || !parsedArticle.content) {
      throw new Error("El JSON devuelto por OpenAI no tiene la estructura correcta.");
    }

    return parsedArticle;

  } catch (error) {
    console.error("❌ Error generando contenido con OpenAI:", error);
    return getMockArticle(topic); // Fallback en caso de error de red o timeout
  }
}