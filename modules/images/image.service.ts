/**
 * Image Service — Pipeline de imagen para artículos.
 *
 * Prueba varias fuentes en cascada y se queda con la primera que supere el
 * control de calidad. El orden va de mejor a peor calidad editorial:
 *
 *   1. og_image        la foto real del artículo original (~85% de cobertura medida)
 *   2. rss_source      la imagen que trae el propio feed
 *   3. stock_pixabay   fotografía de archivo con licencia comercial
 *   4. cloudflare_flux imagen generada con IA (FLUX.1-schnell, gratis)
 *   5. fallback_static imagen de reserva del proyecto
 *
 * Dos reglas de diseño que conviene no romper:
 *
 * - **Cada candidata pasa por el control de calidad** con Gemini Vision antes de
 *   aceptarse. Ese filtro es el suelo de calidad real del proyecto y es
 *   independiente del origen de la imagen: una foto de archivo mediocre se
 *   rechaza igual que una generación mediocre.
 * - **Esta función no lanza nunca.** Antes, si todo fallaba, se perdía el
 *   artículo entero: texto ya escrito, traducido y pagado. Un artículo con una
 *   foto de reserva vale muchísimo más que un artículo que no existe.
 */

import { analyzeImageWithGemini, type ImageAnalysisResult } from '../ai/gemini-vision.service';
import { generateImageWithCloudflare } from '../ai/cloudflare-image.service';
import { saveImageToSupabase } from '../storage/supabase.service';
import { fetchSourceImage } from './source-image.service';
import { searchStockImages } from './stock-image.service';
import { FALLBACK_IMAGES } from '../../config/constants';
import { logWithTime } from '../../lib/logger';

export type ImageSource =
  | 'og_image'
  | 'rss_source'
  | 'stock_pixabay'
  | 'cloudflare_flux'
  | 'fallback_static';

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
  source: ImageSource;
  attempts: string[];
  errors: string[];
}

function generateCaption(title: string, topic?: string): string {
  if (topic) {
    return `Ilustración relacionada con la actualidad de ${topic}: «${title}».`;
  }
  return `Ilustración de actualidad periodística: «${title}».`;
}

/**
 * Elige una imagen de reserva para la categoría. Es determinista y sin red:
 * se usa solo cuando no se ha podido validar ninguna otra candidata.
 */
export function pickFallbackImage(topic?: string): string {
  const porCategoria = topic ? FALLBACK_IMAGES[topic] : undefined;
  const pool = porCategoria?.length ? porCategoria : Object.values(FALLBACK_IMAGES).flat();
  return (
    pool[0] ??
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop'
  );
}

async function isImageValid(
  imageUrl: string,
  title: string,
  summary: string,
  caption: string,
  stepName: string,
  refererUrl?: string
): Promise<{ valid: boolean; qa: ImageAnalysisResult | null; error?: string }> {
  try {
    logWithTime(`🔍 [QA ${stepName}] Analizando imagen...`);

    let qa: ImageAnalysisResult | null = null;
    try {
      qa = await analyzeImageWithGemini(imageUrl, title, summary, caption, refererUrl);
    } catch (geminiErr) {
      const msg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
      logWithTime(`❌ [QA ${stepName}] Falló Gemini Vision de forma definitiva: ${msg}`);
      return { valid: false, qa: null, error: msg };
    }

    if (qa && qa.coherente && qa.calidad_aceptable) {
      logWithTime(`✅ [QA ${stepName}] Imagen APROBADA: ${qa.descripcion}`);
      return { valid: true, qa };
    }

    const razon = qa
      ? qa.problemas_detectados.join(', ') || qa.razon_coherencia
      : 'Análisis fallido';
    logWithTime(`❌ [QA ${stepName}] Imagen RECHAZADA: ${razon}`);
    return { valid: false, qa };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logWithTime(`❌ [QA ${stepName}] Error en análisis: ${msg}`);
    return { valid: false, qa: null, error: msg };
  }
}

/** Valida una candidata y, si pasa el control, la guarda en el almacén permanente. */
async function tryCandidate(
  url: string,
  source: ImageSource,
  stepName: string,
  data: ArticleImageData,
  caption: string,
  refererUrl: string | undefined,
  attempts: string[],
  errors: string[]
): Promise<ImagePipelineResult | null> {
  attempts.push(source);

  const { valid, qa, error } = await isImageValid(
    url,
    data.title,
    data.summary || '',
    caption,
    stepName,
    refererUrl
  );

  if (!valid) {
    if (error) errors.push(`${stepName}: ${error}`);
    return null;
  }

  const finalUrl = await saveImageToSupabase(url, data.slug);
  return {
    imageUrl: finalUrl,
    caption: qa?.caption_mejorado || caption,
    qaResult: qa,
    source,
    attempts,
    errors,
  };
}

export async function generateArticleImageAndAnalyzeQA(
  data: ArticleImageData,
  rssImageUrl?: string,
  sourceLink?: string
): Promise<ImagePipelineResult> {
  const attempts: string[] = [];
  const errors: string[] = [];
  const caption = generateCaption(data.title, data.topic);

  // ── 1. Imagen del artículo original (og:image) ────────────────────────────
  // La mejor opción editorial: es la foto real del suceso que cuenta el artículo.
  // Va antes que el RSS porque el feed solo trae imagen en una parte de los casos,
  // mientras que la página del artículo la declara en la gran mayoría.
  try {
    const sourceImage = await fetchSourceImage(sourceLink);
    if (sourceImage && sourceImage !== rssImageUrl) {
      const result = await tryCandidate(
        sourceImage, 'og_image', 'og:image', data, caption, sourceLink, attempts, errors
      );
      if (result) return result;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logWithTime(`❌ [og:image] Falló: ${msg}`);
    errors.push(`og:image: ${msg}`);
  }

  // ── 2. Imagen del feed RSS ────────────────────────────────────────────────
  if (rssImageUrl) {
    try {
      const result = await tryCandidate(
        rssImageUrl, 'rss_source', 'RSS', data, caption, sourceLink, attempts, errors
      );
      if (result) return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logWithTime(`❌ [RSS] Falló: ${msg}`);
      errors.push(`RSS: ${msg}`);
    }
  }

  // ── 3. Fotografía de archivo con licencia (Pixabay) ───────────────────────
  try {
    const stockUrls = await searchStockImages(data.title, data.topic, 3);
    for (let i = 0; i < stockUrls.length; i++) {
      const result = await tryCandidate(
        stockUrls[i], 'stock_pixabay', `Pixabay ${i + 1}`, data, caption, undefined, attempts, errors
      );
      if (result) return result;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logWithTime(`❌ [Pixabay] Falló: ${msg}`);
    errors.push(`Pixabay: ${msg}`);
  }

  // ── 4. Generación con IA (Cloudflare Workers AI + FLUX.1-schnell) ─────────
  try {
    attempts.push('cloudflare_flux');
    logWithTime('☁️ [Cloudflare] Generando imagen...');
    const generated = await generateImageWithCloudflare(data.originalPrompt || data.title);

    if (generated) {
      const { valid, qa, error } = await isImageValid(
        generated, data.title, data.summary || '', caption, 'Cloudflare'
      );
      if (valid) {
        const finalUrl = await saveImageToSupabase(generated, data.slug);
        return {
          imageUrl: finalUrl,
          caption: qa?.caption_mejorado || caption,
          qaResult: qa,
          source: 'cloudflare_flux',
          attempts,
          errors,
        };
      }
      if (error) errors.push(`Cloudflare: ${error}`);
    } else {
      errors.push('Cloudflare: la generación no devolvió imagen');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logWithTime(`❌ [Cloudflare] Falló: ${msg}`);
    errors.push(`Cloudflare: ${msg}`);
  }

  // ── 5. Imagen de reserva ──────────────────────────────────────────────────
  // Aquí ya no se busca calidad, se busca no perder el artículo. Se intenta
  // validar igualmente, y si tampoco pasa el control se usa de todos modos:
  // es preferible publicar con una foto genérica que no publicar.
  const fallback = pickFallbackImage(data.topic);
  attempts.push('fallback_static');

  const { valid } = await isImageValid(
    fallback, data.title, data.summary || '', caption, 'reserva'
  );

  if (!valid) {
    logWithTime(
      '⚠️ La imagen de reserva tampoco superó el control de calidad; se publica igualmente para no perder el artículo.'
    );
  }

  logWithTime(
    `⚠️ Pipeline de imagen resuelto con la reserva. Errores acumulados: ${errors.join(' | ') || 'ninguno'}`
  );

  return {
    imageUrl: fallback,
    caption,
    qaResult: null,
    source: 'fallback_static',
    attempts,
    errors,
  };
}
