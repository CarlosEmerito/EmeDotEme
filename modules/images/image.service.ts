import { createClient } from '@supabase/supabase-js';
import { 
  generateImageWithAIHorde 
} from '../ai/aihorde-image.service';
import {
  analyzeImageWithGemini
} from '../ai/gemini-vision.service';

// Inicializar cliente de Supabase (usamos Service Role Key para poder subir archivos al bucket sin RLS auth)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface ArticleImageData {
  title: string;
  slug: string;
  topic: string;
  originalPrompt?: string;
  summary?: string;  // Added for Gemini analysis
}

function generateProfessionalCaption(
  title: string,
  topic: string,
  prompt?: string
): string {
  // Implementación mínima temporal para evitar error de compilación
  return `Imagen para: ${title} (${topic})`;
}

async function saveImageToSupabase(imageUrl: string, slug: string): Promise<string | null> {
  // Implementación mínima temporal para evitar error de compilación
  return null;
}

function getFallbackImageByTopic(topic: string): { url: string; caption: string } {
  // Implementación mínima temporal para evitar error de compilación
  return { url: '', caption: `Imagen de fallback para ${topic}` };
}

async function unloadOllamaModel() {
  // ...existing code from unloadOllamaModel...
}

  // Implementación mínima temporal para evitar error de compilación
  return null;
}

export async function generateArticleImage(
  imageData: ArticleImageData,
  originalImageUrl?: string | null
): Promise<{ imageUrl: string; caption: string }> {
  // ...existing code from generateArticleImage...
}
