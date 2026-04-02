/**
 * Servicio de Inteligencia Artificial
 * En este archivo se debe implementar la conexión con la API de OpenAI, Anthropic, o Gemini.
 * Actualmente retorna datos simulados para MVP.
 */

export interface GeneratedArticle {
  title: string;
  summary: string;
  content: string;
}

export async function generateArticleContent(topic?: string): Promise<GeneratedArticle> {
  // TODO: Reemplazar este bloque por una llamada real al LLM (Ej. openai.chat.completions.create)
  // Puedes usar el parámetro `topic` para guiar a la IA sobre qué escribir.

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