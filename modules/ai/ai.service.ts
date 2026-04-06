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

import { generateTextWithGemini } from './gemini-text.service';

// --- NUEVO: Generación vía Ollama local ---
async function generateTextWithOllama({ systemPrompt, userPrompt }: { systemPrompt: string; userPrompt: string; }): Promise<string | null> {
  try {
    // Node.js >=18 ya trae fetch global. Si estás en <18, instala node-fetch.
    const url = 'http://localhost:11434/api/generate';
    const model = process.env.OLLAMA_MODEL || 'llama3';
    const prompt = `${systemPrompt}\n\n${userPrompt}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false
      })
    });
    if (!response.ok) {
      console.error('❌ Error HTTP desde Ollama:', response.status, await response.text());
      return null;
    }
    const data = await response.json();
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

/**
 * Genera un artículo de ejemplo usando Gemini, con fallback a Ollama local si ambas APIs fallan.
 */
export async function generateArticleContent(recentTitles: string[] = []) {
  const systemPrompt = `Eres un generador de artículos de noticias sobre criptomonedas, blockchain y tecnología.`;
  
  let avoidanceClause = '';
  if (recentTitles.length > 0) {
    console.log(`📋 Evitando temas recientes: ${recentTitles.length} artículos`);
    // Limitar a 3 títulos para ahorrar tokens, mostrar los más recientes
    const recentList = recentTitles.slice(0, 3).map(title => `- "${title}"`).join('\n');
    avoidanceClause = `\n\nEVITA temas recientes como:\n${recentList}\n\nNO repitas temas similares (ej: si ya hay "ETF Bitcoin", no hagas "ETF Ethereum"). Enfócate en noticias NUEVAS sobre: escalabilidad, seguridad, adopción, regulación, DeFi, NFTs, Layer 2, puentes, hackeos, partnerships, gaming Web3.`;
  }
  
  const userPrompt = `Genera un artículo de noticias cripto en español.
- Título: claro y atractivo
- Resumen: 1-2 líneas
- Contenido: HTML simple (p, h2), sin hashtags
- Tags: 3-5 palabras clave sin '#', ej: ["Bitcoin", "ETF", "Mercado"]
- imagePrompt: descripción para generar imagen

EVITA: hashtags en HTML, temas recientes listados arriba, contenido repetitivo.

Devuelve SOLO JSON válido: {title, summary, content, imagePrompt, tags}.${avoidanceClause}`;
  
  let result = await generateTextWithGemini({ systemPrompt, userPrompt, maxTokens: 4000, temperature: 0.7 });
  if (!result) {
    console.warn('⚠️ Gemini falló, intentando con Ollama local...');
    result = await generateTextWithOllama({ systemPrompt, userPrompt });
    if (!result) {
      console.error('❌ Ollama también falló. Devolviendo ejemplo estático.');
      return {
        title: 'Artículo de ejemplo',
        summary: 'Resumen de ejemplo',
        content: '<p>Contenido de ejemplo generado por IA.</p>',
        imagePrompt: 'cryptocurrency, blockchain, digital assets'
      };
    }
  }
  try {
    // Elimina posibles code blocks y parsea JSON
    const cleaned = result.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    console.log(`📝 Gemini raw response length: ${result.length} chars`);
    console.log(`📝 First 800 chars: ${result.substring(0, 800)}${result.length > 800 ? '...' : ''}`);
    
    // Verificar si la respuesta parece truncada
    if (result.length < 100) {
      console.warn(`⚠️ Respuesta muy corta (${result.length} chars), posiblemente truncada`);
    }
    
    // Buscar JSON incompleto (falta de cierre)
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      console.error(`❌ Estructura JSON inválida. Start: ${jsonStart}, End: ${jsonEnd}`);
      console.error(`❌ Fragmento problemático: ${cleaned.substring(Math.max(0, jsonStart - 50), Math.min(cleaned.length, (jsonEnd > 0 ? jsonEnd + 50 : 200)))}`);
      throw new Error('JSON incompleto o mal formado');
    }
    
    const jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
    console.log(`🔍 JSON extraído: ${jsonStr.substring(0, 200)}...`);
    
    const parsed = JSON.parse(jsonStr);
    
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
    
    console.log(`✅ JSON parseado correctamente: "${parsed.title.substring(0, 60)}..."`);
    console.log(`✅ Tags: ${JSON.stringify(parsed.tags)}`);
    console.log(`✅ Summary length: ${parsed.summary.length} chars`);
    console.log(`✅ Content length: ${parsed.content.length} chars`);
    
    return parsed;
  } catch (error) {
    console.error(`❌ CRITICAL: Error parseando JSON de Gemini:`);
    console.error(`❌ Error: ${error}`);
    console.error(`❌ Raw response length: ${result.length} chars`);
    console.error(`❌ Raw response (first 1000 chars): ${result.substring(0, 1000)}${result.length > 1000 ? '...' : ''}`);
    console.error(`❌ Cleaned response: ${result.replace(/```json\n?/g, '').replace(/```/g, '').trim().substring(0, 500)}...`);
    
    // Intentar recuperación parcial si hay algún JSON válido
    try {
      const jsonMatch = result.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const partialJson = jsonMatch[0];
        console.log(`🔄 Intentando recuperar JSON parcial: ${partialJson.substring(0, 200)}...`);
        const partial = JSON.parse(partialJson);
        if (partial.title) {
          console.log(`🔄 Recuperado parcialmente: "${partial.title}"`);
          return {
            title: partial.title || 'Artículo de ejemplo',
            summary: partial.summary || 'Resumen de ejemplo',
            content: partial.content || '<p>Contenido generado por IA.</p>',
            imagePrompt: partial.imagePrompt || 'cryptocurrency, blockchain, digital assets',
            tags: Array.isArray(partial.tags) ? partial.tags : []
          };
        }
      }
    } catch (recoveryError) {
      console.error(`❌ Falló recuperación parcial: ${recoveryError}`);
    }
    
    return {
      title: 'Artículo de ejemplo',
      summary: 'Resumen de ejemplo',
      content: '<p>Contenido de ejemplo generado por IA.</p>',
      imagePrompt: 'cryptocurrency, blockchain, digital assets',
      tags: []
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
