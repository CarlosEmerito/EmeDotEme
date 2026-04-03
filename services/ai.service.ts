import OpenAI from "openai";
import { getMarketData } from "./market.service";
import { getLatestNews } from "./news.service";
import { getPublishedArticles } from "./article.service";

export interface GeneratedArticle {
  title: string;
  summary: string;
  content: string;
  tags?: string[];
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
    tags: ["Mercados", "Bitcoin", "Análisis"],
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

  const modelName = process.env.OLLAMA_MODEL || "qwen3.5:27b"; // Usaremos qwen3.5:27b a petición del usuario

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

    const systemPrompt = `Eres Carlos "Emérito" López Lovera, un prestigioso periodista humano y analista senior en mercados institucionales y tecnología Web3 para el portal financiero 'EmeDotEme'.
Tu tarea es escribir un artículo analítico, frío, objetivo y PROFUNDAMENTE DETALLADO que relacione los datos del mercado en vivo con los eventos recientes.

REGLAS ESTRICTAS DE TONO Y ESTILO (¡MUY IMPORTANTE PARA PARECER HUMANO!):
1. PROHIBIDO usar frases clichés de IA como "En conclusión", "En resumen", "El mundo de las criptomonedas", "El mercado cripto está en vilo", "paisaje digital", "revolucionando la forma en que", etc.
2. Mantén un tono frío, analítico y directo, similar a un reporte de Bloomberg, Reuters o The Wall Street Journal. Evita el sensacionalismo extremo o el dramatismo emocional.
3. INVENTA citas plausibles o menciona firmas de análisis reales (ej. Glassnode, CoinGlass, Deribit, Kaiko, JPMorgan) para respaldar tus afirmaciones y darle un tono periodístico auténtico. Ejemplo: "Según datos de Glassnode..." o "Analistas de CoinGlass señalan que...".
4. NO uses palabras excesivamente grandilocuentes. Cierra el artículo con un dato duro, una cita o una proyección sobria, NUNCA con una "conclusión" genérica.
5. NO cometas errores matemáticos. Si citas un porcentaje de cambio (ej. 2%), no digas "subió un 2% que es más del mil por ciento". Sé preciso con los números.

REGLAS ESTRICTAS DE FORMATO Y LONGITUD:
1. Devuelve ÚNICAMENTE un objeto JSON válido con las siguientes 5 propiedades exactas: "title", "summary", "content", "tags", "imageCaption".
2. "title": Un titular directo y periodístico, enfocado en datos y hechos (ej. "Bitcoin supera los $66K impulsado por la acumulación institucional").
3. "summary": Un breve lead (sin HTML) directo al punto, explicando el "qué" y el "por qué" de la noticia.
4. "content": Un artículo extenso en formato HTML. 
   - Debe tener al menos 500-600 palabras y párrafos bien desarrollados.
   - Usa etiquetas <h2> para subtítulos descriptivos (evita títulos robóticos como "La Noticia de Última Hora").
   - Usa etiquetas como <p> y <strong>. NO uses <html>, <body> o <h1>.
   - DEBES ESCRIBIR EL ARTÍCULO COMPLETAMENTE EN ESPAÑOL.
5. "tags": Un array de 3 a 5 strings cortos que representen los temas clave del artículo (ej. ["Bitcoin", "Regulación", "DeFi"]).
6. "imageCaption": Un pie de foto sobrio (1 oración) con un dato clave relacionado con el titular.
7. NUNCA menciones que eres una IA. Escribe como un analista de carne y hueso.
8. NO ESCRIBAS SOBRE ESTOS TEMAS RECIENTES: ${recentTitles || "Ninguno"}.
9. TEMA EXCLUSIVO: Tu artículo DEBE ser sobre criptomonedas, blockchain, Web3 o mercados macroeconómicos.
10. MUY IMPORTANTE: Empieza con { y termina con }. NO uses markdown de bloques de código como \`\`\`json.
11. SEO INTERLINKING: Si mencionas criptomonedas clave (como Bitcoin, Ethereum, Solana) o conceptos importantes, envuélvelos en un enlace HTML apuntando a nuestro propio tag en minúsculas. Ejemplo: <a href="/tag/bitcoin">Bitcoin</a>. Haz esto al menos 2-3 veces en el texto.`;

    const userPrompt = `Aquí tienes los datos actuales y reales del mercado en este mismo instante:

PRECIOS EN VIVO (TOP 5):
${marketContext}

TITULARES DE NOTICIAS DE ÚLTIMA HORA:
${newsContext}

${specificFocus ? specificFocus : `Elige la noticia más relevante sobre mercados y escribe un análisis sobrio.`}

RECUERDA: Tu artículo debe ser analítico, basado en datos, con un tono humano frío y periodístico (estilo Bloomberg). Cita fuentes o firmas de análisis (pueden ser verosímiles o reales como CoinGlass/Glassnode) para darle autoridad. No uses fórmulas de conclusión genéricas. ESCRIBE COMPLETAMENTE EN ESPAÑOL.`;

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
      stream: true,
    });

    let content = "";
    process.stdout.write("✍️ Escribiendo: ");
    
    for await (const chunk of response) {
      const text = chunk.choices[0]?.delta?.content || "";
      content += text;
      process.stdout.write(text); // Mostrar en tiempo real en la terminal
    }
    console.log("\n");
    
    if (!content) {
      throw new Error("Ollama devolvió una respuesta vacía.");
    }

    // Limpieza y extracción robusta del JSON
    content = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    content = extractJsonFromText(content);

    const parsedArticle = JSON.parse(content) as GeneratedArticle;
    
    // FILTRO POST-PROCESAMIENTO: Eliminar conclusiones de IA
    const clicheRegex = /<p>\s*(\*\*|<b>)?\s*(En conclusi[oó]n|En resumen|Para concluir|Para resumir|A modo de conclusi[oó]n|En definitiva|En síntesis|En pocas palabras|En suma)[,.:\s]*(?:\*\*|<\/b>)?\s*(.*?)/gi;
    
    parsedArticle.content = parsedArticle.content.replace(clicheRegex, (match, p1, p2, p3) => {
        // p3 contiene el resto de la oración después del cliché.
        if (p3) {
            // Capitalizar la primera letra del texto que queda
            const capitalizedText = p3.charAt(0).toUpperCase() + p3.slice(1);
            return `<p>${capitalizedText}`;
        }
        return '<p>';
    });

    // Validación básica de la estructura del JSON
    if (!parsedArticle.title || !parsedArticle.summary || !parsedArticle.content) {
      throw new Error("El JSON devuelto por Ollama no tiene la estructura correcta.");
    }

    if (selectedImageUrl) {
      parsedArticle.sourceImageUrl = selectedImageUrl;
    }

    console.log(`✅ Artículo generado con éxito por Ollama: ${parsedArticle.title}`);
    return parsedArticle;

  } catch (error: any) {
    console.error("❌ Error generando contenido con Ollama:", error.message || error);
    return await getFallbackArticle(topic); // Fallback dinámico si la IA local falla
  }
}