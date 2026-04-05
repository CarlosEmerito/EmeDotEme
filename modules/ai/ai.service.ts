/**
 * Placeholder para generación de newsletter semanal
 */
export async function generateWeeklyNewsletter() {
	return {
		subject: 'Newsletter semanal (placeholder)',
		html: '<p>Contenido de ejemplo generado por IA.</p>',
		htmlContent: '<p>Contenido de ejemplo generado por IA.</p>',
		articles: []
	};
}

import { generateTextWithGemini } from './gemini-text.service';

/**
 * Genera un artículo de ejemplo usando Gemini. Personaliza la lógica según tus necesidades.
 */
export async function generateArticleContent() {
	const systemPrompt = `Eres un generador de artículos de noticias sobre criptomonedas, blockchain y tecnología.`;
	const userPrompt = `Genera un artículo breve con título, resumen y contenido en HTML sobre una noticia relevante de criptomonedas. Devuelve un objeto JSON con las propiedades: title, summary, content, imagePrompt.`;
	const result = await generateTextWithGemini({ systemPrompt, userPrompt, maxTokens: 2048, temperature: 0.7 });
	if (!result) {
		return {
			title: 'Artículo de ejemplo',
			summary: 'Resumen de ejemplo',
			content: '<p>Contenido de ejemplo generado por IA.</p>',
			imagePrompt: 'cryptocurrency, blockchain, digital assets'
		};
	}
	try {
		// Elimina posibles code blocks y parsea JSON
		const cleaned = result.replace(/```json\n?/g, '').replace(/```/g, '').trim();
		return JSON.parse(cleaned);
	} catch {
		return {
			title: 'Artículo de ejemplo',
			summary: 'Resumen de ejemplo',
			content: '<p>Contenido de ejemplo generado por IA.</p>',
			imagePrompt: 'cryptocurrency, blockchain, digital assets'
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
