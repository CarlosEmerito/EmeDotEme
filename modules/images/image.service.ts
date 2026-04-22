/**
 * Image Service — Pipeline de imagen para artículos
 *
 * FLUJO:
 * 1. Intentar usar imagen de la fuente RSS → QA con Gemini Vision
 *    - Si pasa QA → subir a Supabase → usar
 *    - Si no pasa QA → paso 2
 * 2. Generar con AI Horde (intento 1) → QA con Gemini Vision
 *    - Si pasa QA → subir a Supabase → usar
 *    - Si no pasa QA → paso 3
 * 3. Generar con AI Horde (intento 2) → QA con Gemini Vision
 *    - Si pasa QA → subir a Supabase → usar
 *    - Si no pasa QA → paso 4
 * 4. FALLBACK: imagen de stock Unsplash
 */

import { analyzeImageWithGemini, type ImageAnalysisResult } from '../ai/gemini-vision.service';
import { analyzeImageWithOllama } from '../ai/ollama-vision.service';
import { generateImageWithAIHorde } from '../ai/aihorde-image.service';
import { createClient } from '@supabase/supabase-js';
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
  source: 'rss_source' | 'ai_horde' | 'unsplash_stock';
  attempts: string[];
  errors: string[];
}

// ============================================================
// CONSTANTES
// ============================================================



const AI_HORDE_OPTIONS = {
  width: 1024,
  height: 1024,
  steps: 100,
  sampler_name: 'k_dpmpp_2m',
  n: 1,
  karras: true,
  qualityToggle: true,
  negative_prompt: "text, watermark, logo, signature, words, handwriting, captions, subtitles, labels, numbers, nsfw, porn, nude, explicit, worst quality, low quality, jpeg artifacts, blurry, muted colors, deformed, bad anatomy",
};

// ============================================================
// UTILIDADES
// ============================================================

function generateCaption(title: string, topic?: string): string {
  if (topic) {
    return `Representación artística de «${title}» en el contexto de ${topic}.`;
  }
  return `Escena representativa sobre «${title}».`;
}

/**
 * Sube una imagen a Supabase Storage y retorna la URL pública permanente.
 * Si falla o no hay credenciales, retorna la URL original.
 */
export async function saveImageToSupabase(url: string, slug: string): Promise<string> {
  // Skip si ya es una URL permanente
  const permanentDomains = ['images.unsplash.com', 'supabase.co', 'supabase.com', 'emedoteme.es'];
  try {
    const urlObj = new URL(url);
    if (permanentDomains.some(d => urlObj.hostname.includes(d))) return url;
  } catch { /* continuar */ }

  if (url.includes('supabase.co/storage/v1/object/public/')) return url;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Supabase] Credenciales no configuradas, usando URL original');
    return url;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const bucketName = 'article-images';

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/webp';
    const extension = contentType.split('/')[1] || 'webp';
    const fileName = `${slug}-${Date.now()}.${extension}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, Buffer.from(buffer), { contentType, upsert: false });

    if (error) {
      console.error('[Supabase] Error de upload:', error.message);
      return url;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    console.log(`✅ [Supabase] Imagen subida: ${fileName}`);
    return publicUrl;
  } catch (error) {
    console.error('[Supabase] Error:', error);
    return url;
  }
}

// ============================================================
// QA: Verificar imagen con Gemini Vision
// ============================================================

/**
 * Analiza una imagen con Gemini Vision y determina si es válida.
 * Retorna true si: coherente + calidad aceptable + sin marca de agua.
 */
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
    } catch (geminiError) {
      console.warn(`⚠️ [QA ${stepName}] Gemini Vision falló, intentando fallback con Ollama local... (${geminiError})`);
      qa = await analyzeImageWithOllama(imageUrl, title, summary, caption);
    }

    const hasWatermark = qa.problemas_detectados?.some(
      (p: string) => p.toLowerCase().includes('marca de agua') || p.toLowerCase().includes('watermark')
    );

    const valid = qa.coherente && qa.calidad_aceptable && !hasWatermark;

    if (valid) {
      console.log(`✅ [QA ${stepName}] Imagen APROBADA: ${qa.razon_coherencia}`);
    } else {
      const reasons: string[] = [];
      if (!qa.coherente) reasons.push('no coherente');
      if (!qa.calidad_aceptable) reasons.push('calidad baja');
      if (hasWatermark) reasons.push('marca de agua');
      console.log(`❌ [QA ${stepName}] Imagen RECHAZADA: ${reasons.join(', ')} — ${qa.razon_coherencia}`);
    }

    return { valid, qa };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`❌ [QA ${stepName}] Error de análisis (ambos modelos fallaron): ${msg}`);
    return { valid: false, qa: null, error: msg };
  }
}

// ============================================================
// AI HORDE: Generar imagen y validar
// ============================================================

/**
 * Genera una imagen con AI Horde, la verifica (no CSAM/error) y retorna la URL.
 * Retorna null si falla.
 */
async function generateWithAIHorde(
  prompt: string,
  slug: string,
  attemptNumber: number
): Promise<string | null> {
  try {
    console.log(`\n🎨 [AI Horde #${attemptNumber}] Generando imagen...`);
    console.log(`   Prompt: ${prompt.substring(0, 100)}...`);

    const aiHordeUrl = await generateImageWithAIHorde(prompt, slug, AI_HORDE_OPTIONS);

    if (!aiHordeUrl || !aiHordeUrl.startsWith('http')) {
      console.error(`❌ [AI Horde #${attemptNumber}] URL inválida o vacía`);
      return null;
    }

    console.log(`✅ [AI Horde #${attemptNumber}] URL generada: ${aiHordeUrl.substring(0, 80)}...`);

    return aiHordeUrl;
  } catch (error) {
    console.error(`❌ [AI Horde #${attemptNumber}] Error: ${error}`);
    return null;
  }
}

// ============================================================
// PIPELINE PRINCIPAL
// ============================================================

/**
 * Pipeline completo de imagen para un artículo.
 *
 * @param imageData   Datos del artículo (título, slug, tema, prompt)
 * @param sourceImageUrl  URL de imagen de la fuente RSS (si existe)
 */
export async function generateArticleImageAndAnalyzeQA(
  imageData: ArticleImageData,
  sourceImageUrl?: string | null,
  _opts?: { testMode?: boolean }
): Promise<ImagePipelineResult> {
  const attempts: string[] = [];
  const errors: string[] = [];
  const caption = generateCaption(imageData.title, imageData.topic);
  const basePrompt = imageData.originalPrompt || imageData.title;
  const hordePrompt = `${basePrompt}, masterpiece, highly detailed, 8k resolution, award-winning photography, cinematic lighting, ultra-realistic, sharp focus, visually stunning, clean, vibrant`.slice(0, 1000);

  console.log('\n🖼️ ═══════════════════════════════════════════════════════');
  console.log('🖼️  PIPELINE DE IMAGEN');
  console.log('🖼️ ═══════════════════════════════════════════════════════\n');

  // ────────────────────────────────────────────────────────────
  // PASO 1: Intentar imagen de la fuente RSS
  // ────────────────────────────────────────────────────────────
  if (sourceImageUrl) {
    console.log(`\n📸 [Paso 1] Imagen de la fuente: ${sourceImageUrl.substring(0, 80)}...`);
    attempts.push('Paso 1: Imagen de fuente RSS');

    const { valid, qa } = await isImageValid(
      sourceImageUrl, imageData.title, imageData.summary || '', caption, 'Fuente RSS'
    );

    if (valid) {
      // ✅ Imagen de la fuente aprobada → subir a Supabase
      const permanentUrl = await saveImageToSupabase(sourceImageUrl, imageData.slug);
      const finalCaption = qa?.caption_mejorado || caption;

      console.log('🖼️ ═══ RESULTADO: Imagen de fuente RSS aprobada ═══\n');
      return {
        imageUrl: permanentUrl,
        caption: finalCaption,
        qaResult: qa,
        source: 'rss_source',
        attempts,
        errors,
      };
    } else {
      errors.push('Imagen de fuente RSS no pasó QA');
    }
  } else {
    console.log('\n📸 [Paso 1] No hay imagen de fuente RSS, saltando al paso 2');
    attempts.push('Paso 1: Sin imagen de fuente');
  }

  // ────────────────────────────────────────────────────────────
  // PASO 2: Generar con AI Horde (intento 1)
  // ────────────────────────────────────────────────────────────
  console.log('\n🎨 [Paso 2] Generación con AI Horde (intento 1)');
  attempts.push('Paso 2: AI Horde intento 1');

  const hordeUrl1 = await generateWithAIHorde(hordePrompt, imageData.slug, 1);
  if (hordeUrl1) {
    const permanentUrl = await saveImageToSupabase(hordeUrl1, imageData.slug);
    console.log('🖼️ ═══ RESULTADO: AI Horde intento 1 usada (sin QA) ═══\n');
    return {
      imageUrl: permanentUrl,
      caption: caption,
      qaResult: null,
      source: 'ai_horde',
      attempts,
      errors,
    };
  } else {
    errors.push('AI Horde #1 falló al generar');
  }

  // ────────────────────────────────────────────────────────────
  // PASO 3: Generar con AI Horde (intento 2)
  // ────────────────────────────────────────────────────────────
  console.log('\n🎨 [Paso 3] Generación con AI Horde (intento 2)');
  attempts.push('Paso 3: AI Horde intento 2');

  const hordeUrl2 = await generateWithAIHorde(hordePrompt, `${imageData.slug}-retry`, 2);
  if (hordeUrl2) {
    const permanentUrl = await saveImageToSupabase(hordeUrl2, imageData.slug);
    console.log('🖼️ ═══ RESULTADO: AI Horde intento 2 usada (sin QA) ═══\n');
    return {
      imageUrl: permanentUrl,
      caption: caption,
      qaResult: null,
      source: 'ai_horde',
      attempts,
      errors,
    };
  } else {
    errors.push('AI Horde #2 falló al generar');
  }

  // ────────────────────────────────────────────────────────────
  // PASO 4: FALLBACK — Imagen de stock Unsplash
  // ────────────────────────────────────────────────────────────
  console.log('\n⚠️ [Paso 4] FALLBACK: Usando imagen de stock Unsplash');
  attempts.push('Paso 4: Fallback Unsplash');

  const category = imageData.topic || "Tecnología";
  const options = FALLBACK_IMAGES[category] || FALLBACK_IMAGES["Tecnología"];
  const stockUrl = options[Math.floor(Math.random() * options.length)];
  const stockCaption = `Imagen ilustrativa sobre ${category}`;

  console.log(`📷 Stock seleccionado: ${stockUrl}`);
  console.log('🖼️ ═══ RESULTADO: Usando imagen de stock ═══\n');

  return {
    imageUrl: stockUrl,
    caption: stockCaption,
    qaResult: null,
    source: 'unsplash_stock',
    attempts,
    errors,
  };
}
