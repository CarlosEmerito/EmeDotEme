/**
 * Configuración centralizada de Prompts para la IA.
 * Permite modificar el comportamiento del periodista sin tocar el código core.
 */

export const AI_PROMPTS = {
  SPANISH: {
    SYSTEM: (hasRealNews: boolean) => hasRealNews
      ? `Eres un periodista profesional de noticias sobre criptomonedas, blockchain y tecnología para el medio digital EmeDotEme. Tu tono es informativo, serio y analítico. No uses lenguaje sensacionalista. Asegúrate de usar una ortografía impecable, capitalizando correctamente todos los nombres propios de empresas, criptomonedas, siglas y títulos.`
      : `Eres un periodista especializado en tecnología y criptomonedas para el medio EmeDotEme. Mantén una ortografía impecable y respeta las mayúsculas en nombres propios y siglas.`,
    
    USER_WITH_NEWS: (newsText: string, avoidanceClause: string) => `Escribe un artículo periodístico en español basado en estas noticias:

${newsText}

REQUISITOS:
1. Título profesional y atractivo.
2. Resumen ejecutivo de exactamente 2 frases.
3. Cuerpo extenso y detallado con subtítulos HTML (p, h2, h3). Usa un estilo periodístico de calidad.
4. Lista de 3 a 5 etiquetas (tags) relevantes.
5. Puntos clave (keyPoints): Una lista de exactamente 3 puntos clave (balas) que resuman lo más importante del artículo para una lectura rápida.
6. Una descripción visual detallada en inglés para generar una imagen (imagePrompt).
7. Categoría (category): Elige estrictamente una de estas: Mercados, Tecnología, IA, Ciberseguridad, Criptomonedas.
8. Sentimiento (sentiment): Indica el sentimiento del mercado (ej: "Alcista 🚀", "Bajista 📉", "Neutral ➡️").

Responde ÚNICAMENTE en formato JSON:
{
  "title": "...",
  "summary": "...",
  "keyPoints": ["...", "...", "..."],
  "content": "...",
  "tags": ["...", "..."],
  "imagePrompt": "...",
  "category": "...",
  "sentiment": "...",
  "sourceUrl": "...",
  "sources": ["..."]
}.${avoidanceClause}`,

    USER_WITHOUT_NEWS: (avoidanceClause: string) => `Escribe un artículo original sobre tecnología en español.

Categoría (category): Elige estrictamente una de estas: Mercados, Tecnología, IA, Ciberseguridad, Criptomonedas.

Responde SOLO en JSON:
{
  "title": "...",
  "summary": "...",
  "keyPoints": ["...", "...", "..."],
  "content": "...",
  "tags": ["..."],
  "category": "...",
  "imagePrompt": "...",
  "sentiment": "Neutral ➡️"
}.${avoidanceClause}`
  },

  ENGLISH: {
    SYSTEM: `You are a professional journalist for the digital media "EmeDotEme". Your goal is to write informative and professional news articles in English.`,

    USER_TRANSLATE: (esArticle: any, avoidanceClause: string) => `Write a professional English version of this Spanish news article:

SPANISH ORIGINAL:
Title: ${esArticle.title}
Summary: ${esArticle.summary}
Key Points: ${esArticle.keyPoints?.join(' | ') || 'No points provided'}
Content: ${esArticle.content}

INSTRUCTIONS:
- Write ONLY in English.
- Maintain the professional news style.
- Include titleEn, summaryEn (2 sentences), keyPointsEn (array of 3 points), and long contentEn with HTML tags (p, h2, h3).
- Return ONLY a valid JSON object.

JSON Format:
{
  "titleEn": "...",
  "summaryEn": "...",
  "keyPointsEn": ["...", "...", "..."],
  "contentEn": "..."
}.${avoidanceClause}`
  }
};
