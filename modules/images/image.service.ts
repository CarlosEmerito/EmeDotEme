/**
 * Image Service — Pipeline de imagen para artículos
 */

import { analyzeImageWithGemini, type ImageAnalysisResult } from '../ai/gemini-vision.service';
import { analyzeImageWithOllama } from '../ai/ollama-vision.service';
import { generateImageWithAIHorde } from '../ai/aihorde-image.service';
import { generateImageWithHuggingFace } from '../ai/hf-image.service';
import { generateImageWithFlux, checkFluxStatus } from '../ai/flux-image.service';
import { unloadOllamaModels } from '../vram/vram-manager';
import { saveImageToSupabase } from '../storage/supabase.service';
import { FALLBACK_IMAGES } from '../../config/constants';

// ============================================================
// TIPOS
// ============================================================

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

// ============================================================
// CONSTANTES
// ============================================================

const AI_HORDE_OPTIONS = {
  width: 1024,
  height: 1024,
  steps: 50,
  sampler_name: 'k_dpmpp_2m',
  n: 1,
  karras: true,
  qualityToggle: true,
  negative_prompt: "(worst quality, low quality, normal quality, lowres, low details, grayscale), text, watermark, logo, signature, words, handwriting, captions, subtitles, labels, numbers, nsfw, porn, nude, explicit, jpeg artifacts, blurry, muted colors, deformed, bad anatomy, bad proportions, bad hands, extra fingers, missing fingers",
};

// ============================================================
// UTILIDADES
// ============================================================

function generateCaption(title: string, topic?: string): string {
  if (topic) {
    return `Ilustración relacionada con la actualidad de ${topic}: «${title}».`;
  }
  return `Ilustración de actualidad periodística: «${title}».`;
}

// ============================================================
// QA: Verificar imagen con IA Vision
// ============================================================

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
      // CLOUD MIGRATION: Desactivado fallback a Ollama Vision
      // console.warn('⚠️ Gemini Vision falló, intentando con Ollama Vision...');
      // qa = await analyzeImageWithOllama(imageUrl, title, summary, caption);
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

// ============================================================
// PIPELINE PRINCIPAL
// ============================================================

export async function generateArticleImageAndAnalyzeQA(
  data: ArticleImageData,
  rssImageUrl?: string
): Promise<ImagePipelineResult> {
  const attempts: string[] = [];
  const errors: string[] = [];
  const caption = generateCaption(data.title, data.topic);

  // --- PASO 1: Fuente RSS ---
  if (rssImageUrl) {
    attempts.push('rss_source');
    const { valid, qa, error } = await isImageValid(rssImageUrl, data.title, data.summary || '', caption, 'RSS');
    if (valid) {
      const finalUrl = await saveImageToSupabase(rssImageUrl, data.slug);
      return { imageUrl: finalUrl, caption: qa?.caption_mejorado || caption, qaResult: qa, source: 'rss_source', attempts, errors };
    }
    if (error) errors.push(`RSS: ${error}`);
  }

  // --- PASO 2: Flux Local ---
  // CLOUD MIGRATION: Desactivada la generación con GPU local (Flux) para compatibilidad en la nube
  /*
  const isFluxReady = await checkFluxStatus();
  if (isFluxReady) {
    try {
      attempts.push('flux_local');
      console.log('🎨 [Flux] Generando imagen local...');
      await unloadOllamaModels();
      const fluxUrl = await generateImageWithFlux(data.originalPrompt || data.title, data.slug);
      if (fluxUrl) {
        const { valid, qa, error } = await isImageValid(fluxUrl, data.title, data.summary || '', caption, 'Flux');
        if (valid) {
          const finalUrl = await saveImageToSupabase(fluxUrl, data.slug);
          return { imageUrl: finalUrl, caption: qa?.caption_mejorado || caption, qaResult: qa, source: 'flux_local', attempts, errors };
        }
        if (error) errors.push(`Flux: ${error}`);
      } else {
        errors.push('Flux: Generación devolvió null');
      }
    } catch (err: any) {
      console.error('❌ Flux Local falló:', err.message);
      errors.push(`Flux Exception: ${err.message}`);
    }
  }
  */

  // --- PASO 2.5: Hugging Face API (FLUX.1-schnell) ---
  try {
    attempts.push('hf_api');
    console.log('☁️ [HF API] Generando imagen...');
    const hfUrl = await generateImageWithHuggingFace(data.originalPrompt || data.title, data.slug);
    if (hfUrl) {
      const { valid, qa, error } = await isImageValid(hfUrl, data.title, data.summary || '', caption, 'HuggingFace');
      if (valid) {
        const finalUrl = await saveImageToSupabase(hfUrl, data.slug);
        return { imageUrl: finalUrl, caption: qa?.caption_mejorado || caption, qaResult: qa, source: 'flux_local', attempts, errors }; // We can masquerade as flux_local or add a new source type, let's just add it
      }
      if (error) errors.push(`HF API: ${error}`);
    } else {
      errors.push('HF API: Generación devolvió null');
    }
  } catch (err: any) {
    console.error('❌ Hugging Face API falló:', err.message);
    errors.push(`HF Exception: ${err.message}`);
  }

  // --- PASO 3: AI Horde ---
  // CLOUD MIGRATION / USER REQUEST: Desactivado fallback. Si HF falla, la publicación debe abortarse.
  /*
  try {
    attempts.push('ai_horde');
    console.log('☁️ [AI Horde] Generando imagen (fallback)...');
    const hordeUrl = await generateImageWithAIHorde(data.originalPrompt || data.title, data.slug, AI_HORDE_OPTIONS);
    if (hordeUrl) {
      const { valid, qa, error } = await isImageValid(hordeUrl, data.title, data.summary || '', caption, 'Horde');
      if (valid) {
        const finalUrl = await saveImageToSupabase(hordeUrl, data.slug);
        return { imageUrl: finalUrl, caption: qa?.caption_mejorado || caption, qaResult: qa, source: 'ai_horde', attempts, errors };
      }
      if (error) errors.push(`Horde: ${error}`);
    } else {
      errors.push('Horde: Generación devolvió null');
    }
  } catch (err: any) {
    console.error('❌ AI Horde falló:', err.message);
    errors.push(`Horde Exception: ${err.message}`);
  }
  */

  // --- FALLBACK FINAL: Eliminado por petición del usuario ---
  // Si llegamos aquí, es que todos los métodos han fallado.
  const errorDetail = errors.join(' | ');
  console.error(`❌ No se pudo obtener ninguna imagen válida tras agotar todos los métodos. Errores: ${errorDetail}`);
  throw new Error(`Pipeline de imagen fallido: No se pudo generar o validar ninguna imagen coherente y de calidad. DETALLES: ${errorDetail}`);
}
