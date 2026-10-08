/**
 * Image Service — Pipeline de imagen para artículos.
 *
 * Solo se usan imágenes que el proyecto puede utilizar sin autorización de
 * terceros ("nivel limpio"):
 *
 *   1. stock_pixabay   fotografía de archivo con licencia comercial
 *   2. cloudflare_flux imagen generada con IA (FLUX.1-schnell, gratis)
 *   3. fallback_static imagen de reserva del propio proyecto
 *
 * **Por qué ya no se usan las imágenes de prensa.** Las versiones anteriores
 * tomaban la imagen del feed RSS o de la página del artículo original. El
 * artículo 129 bis.2 del TRLPI es explícito: la puesta a disposición del público
 * de «cualquier texto, imagen, obra fotográfica o mera fotografía» de una
 * publicación de prensa **está sujeta a autorización**, sin excepción de
 * extractos para las imágenes. Descargarlas y volver a alojarlas en el almacén
 * propio agrava la situación. La vía correcta para referirse a la cobertura
 * ajena es **enlazarla**, no copiarla: el hiperenlace está expresamente excluido
 * de ese derecho (art. 129 bis.6) y es lo que hace `SourceAttribution` en la
 * página del artículo.
 *
 * Dos reglas de diseño que conviene no romper:
 *
 * - **Cada candidata pasa por el control de calidad** con Gemini Vision antes de
 *   aceptarse. Ese filtro es el suelo de calidad real del proyecto y es
 *   independiente del origen de la imagen.
 * - **Esta función no lanza nunca.** Si todo falla, se publica con la imagen de
 *   reserva: un artículo con una foto genérica vale muchísimo más que un
 *   artículo que no existe.
 */

import { analyzeImageWithGemini, type ImageAnalysisResult } from '../ai/gemini-vision.service';
import { generateImageWithCloudflare } from '../ai/cloudflare-image.service';
import { saveImageToSupabase } from '../storage/supabase.service';
import { searchStockImages } from './stock-image.service';
import { FALLBACK_IMAGES } from '../../config/constants';
import { logWithTime } from '../../lib/logger';

export type ImageSource = 'stock_pixabay' | 'cloudflare_flux' | 'fallback_static';

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

/** Pie de foto de una imagen generada: hay que decirlo, no disimularlo. */
function aiCaption(title: string, topic?: string): string {
  const base = topic
    ? `Imagen generada con inteligencia artificial para ilustrar esta información sobre ${topic}: «${title}».`
    : `Imagen generada con inteligencia artificial para ilustrar esta información: «${title}».`;
  return base;
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
    undefined
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
  data: ArticleImageData
): Promise<ImagePipelineResult> {
  const attempts: string[] = [];
  const errors: string[] = [];
  const caption = generateCaption(data.title, data.topic);

  // ── 1. Fotografía de archivo con licencia (Pixabay) ───────────────────────
  // Una foto real con licencia comercial es mejor que cualquier imagen generada:
  // no inventa escenas y es limpia legalmente.
  try {
    const stockUrls = await searchStockImages(data.title, data.topic, 3);
    for (let i = 0; i < stockUrls.length; i++) {
      const result = await tryCandidate(
        stockUrls[i], 'stock_pixabay', `Pixabay ${i + 1}`, data, caption, attempts, errors
      );
      if (result) return result;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logWithTime(`❌ [Pixabay] Falló: ${msg}`);
    errors.push(`Pixabay: ${msg}`);
  }

  // ── 2. Generación con IA (Cloudflare Workers AI + FLUX.1-schnell) ─────────
  try {
    attempts.push('cloudflare_flux');
    logWithTime('☁️ [Cloudflare] Generando imagen...');
    const generated = await generateImageWithCloudflare(data.originalPrompt || data.title);

    if (generated) {
      const captionIA = aiCaption(data.title, data.topic);
      const { valid, qa, error } = await isImageValid(
        generated, data.title, data.summary || '', captionIA, 'Cloudflare'
      );
      if (valid) {
        const finalUrl = await saveImageToSupabase(generated, data.slug);
        return {
          imageUrl: finalUrl,
          // El pie de foto deja claro que la imagen es sintética.
          caption: qa?.caption_mejorado || captionIA,
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

  // ── 3. Imagen de reserva ──────────────────────────────────────────────────
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
