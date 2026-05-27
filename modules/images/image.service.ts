/**
 * Image Service — Pipeline de imagen para artículos
 */

import { analyzeImageWithGemini, type ImageAnalysisResult } from '../ai/gemini-vision.service';
import { generateImageWithHuggingFace } from '../ai/hf-image.service';
import { saveImageToSupabase } from '../storage/supabase.service';

export interface ArticleImageData {
  title: string;
  slug: string;
  topic?: string;
  originalPrompt?: string;
  summary?: string;
}

export interface ImagePipelineResult {
  imageUrl: string;
  caption: string;
  qaResult: ImageAnalysisResult | null;
  source: 'rss_source' | 'flux_local' | 'ai_horde' | 'fallback_unsplash';
  attempts: string[];
  errors: string[];
}

function generateCaption(title: string, topic?: string): string {
  if (topic) {
    return `Ilustración relacionada con la actualidad de ${topic}: «${title}».`;
  }
  return `Ilustración de actualidad periodística: «${title}».`;
}

async function isImageValid(
  imageUrl: string,
  title: string,
  summary: string,
  caption: string,
  stepName: string
): Promise<{ valid: boolean; qa: ImageAnalysisResult | null; error?: string }> {
  try {
    console.log(`🔍 [QA ${stepName}] Analizando imagen...`);

    let qa: ImageAnalysisResult | null = null;
    try {
      qa = await analyzeImageWithGemini(imageUrl, title, summary, caption);
    } catch (geminiErr: any) {
      console.error(`❌ Falló Gemini Vision de forma definitiva. Error: ${geminiErr.message}`);
    }

    if (qa && qa.coherente && qa.calidad_aceptable) {
      console.log(`✅ [QA ${stepName}] Imagen APROBADA: ${qa.descripcion}`);
      return { valid: true, qa };
    } else {
      const razon = qa ? (qa.problemas_detectados.join(', ') || qa.razon_coherencia) : 'Análisis fallido';
      console.warn(`❌ [QA ${stepName}] Imagen RECHAZADA: ${razon}`);
      return { valid: false, qa };
    }
  } catch (error: any) {
    console.error(`❌ [QA ${stepName}] Error en análisis:`, error.message);
    return { valid: false, qa: null, error: error.message };
  }
}

export async function generateArticleImageAndAnalyzeQA(
  data: ArticleImageData,
  rssImageUrl?: string
): Promise<ImagePipelineResult> {
  const attempts: string[] = [];
  const errors: string[] = [];
  const caption = generateCaption(data.title, data.topic);

  if (rssImageUrl) {
    attempts.push('rss_source');
    const { valid, qa, error } = await isImageValid(rssImageUrl, data.title, data.summary || '', caption, 'RSS');
    if (valid) {
      const finalUrl = await saveImageToSupabase(rssImageUrl, data.slug);
      return { imageUrl: finalUrl, caption: qa?.caption_mejorado || caption, qaResult: qa, source: 'rss_source', attempts, errors };
    }
    if (error) errors.push(`RSS: ${error}`);
  }

  try {
    attempts.push('hf_api');
    console.log('☁️ [HF API] Generando imagen...');
    const hfUrl = await generateImageWithHuggingFace(data.originalPrompt || data.title, data.slug);
    if (hfUrl) {
      const { valid, qa, error } = await isImageValid(hfUrl, data.title, data.summary || '', caption, 'HuggingFace');
      if (valid) {
        const finalUrl = await saveImageToSupabase(hfUrl, data.slug);
        return { imageUrl: finalUrl, caption: qa?.caption_mejorado || caption, qaResult: qa, source: 'flux_local', attempts, errors };
      }
      if (error) errors.push(`HF API: ${error}`);
    } else {
      errors.push('HF API: Generación devolvió null');
    }
  } catch (err: any) {
    console.error('❌ Hugging Face API falló:', err.message);
    errors.push(`HF Exception: ${err.message}`);
  }

  const errorDetail = errors.join(' | ');
  console.error(`❌ No se pudo obtener ninguna imagen válida tras agotar todos los métodos. Errores: ${errorDetail}`);
  throw new Error(`Pipeline de imagen fallido: No se pudo generar o validar ninguna imagen coherente y de calidad. DETALLES: ${errorDetail}`);
}
