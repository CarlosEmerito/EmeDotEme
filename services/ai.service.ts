import OpenAI from "openai";
import { getMarketData, getLatestNews } from "./market.service";
import { generateTextWithGemini, isGeminiAvailable } from "./gemini-text.service";

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

export async function generateArticleContent(topic?: string): Promise<GeneratedArticle> {
  // Lógica para generar contenido del artículo utilizando IA
  // ...
}

export async function translateArticleContent(article: GeneratedArticle): Promise<GeneratedArticle> {
  // Lógica para traducir el contenido del artículo al inglés
  // ...
}
