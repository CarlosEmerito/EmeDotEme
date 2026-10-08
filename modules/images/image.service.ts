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
 * Tres reglas de diseño que conviene no romper:
 *
 * - **Cada candidata pasa por el control de calidad** con Gemini Vision antes de
 *   aceptarse. Ese filtro es el suelo de calidad real del proyecto y es
 *   independiente del origen de la imagen.
 * - **El pie de foto describe la imagen**, no su procedencia. Lo redacta el
 *   control de calidad a partir de lo que la imagen muestra; el origen (archivo
 *   con licencia, generada, reserva) se informa a quien revisa el artículo
 *   antes de publicarlo, no en la web.
 * - **Nunca se repite la misma imagen que un artículo reciente** si hay
 *   alternativa: ni entre las candidatas de archivo, ni en la reserva, que rota
 *   por el pool de la categoría en vez de devolver siempre la primera.
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

/** Cómo se ha obtenido la imagen, para informar a quien revisa el artículo. */
export const IMAGE_SOURCE_LABEL: Record<ImageSource, string> = {
  stock_pixabay: 'foto de archivo de Pixabay (licencia comercial)',
  cloudflare_flux: 'generada con IA (FLUX, Cloudflare)',
  fallback_static: 'imagen de reserva del propio medio',
};

/** Imagen usada por un artículo reciente, para no repetirla. */
export interface RecentImage {
  url: string;
  title: string;
}

export interface ArticleImageData {
  title: string;
  slug: string;
  topic?: string;
  originalPrompt?: string;
  summary?: string;
  /**
   * Imágenes de los últimos artículos, de la más reciente a la más antigua.
   * Se usa para no repetir foto y para poder decir «esta ya salió».
   */
  recentlyUsedImages?: RecentImage[];
}

export interface ImagePipelineResult {
  imageUrl: string;
  caption: string;
  qaResult: ImageAnalysisResult | null;
  source: ImageSource;
  attempts: string[];
  errors: string[];
  /** Título del artículo reciente que ya usaba esta misma imagen, si lo hay. */
  duplicateOf: string | null;
}

/**
 * Pie de foto de respaldo: solo se usa si el control de calidad no ha podido
 * describir la imagen. No menciona cómo se ha obtenido.
 */
export function generateCaption(title: string, topic?: string): string {
  if (topic) {
    return `Ilustración sobre ${topic} para «${title}».`;
  }
  return `Ilustración para «${title}».`;
}

/**
 * Elige el pie de foto definitivo: el que ha redactado el control de calidad
 * describiendo la imagen; si no lo hay, su descripción objetiva; y si no,
 * el de respaldo.
 */
export function resolveCaption(
  qa: { caption_mejorado?: string | null; descripcion?: string | null } | null | undefined,
  fallback: string
): string {
  const mejorado = qa?.caption_mejorado?.trim();
  if (mejorado) return mejorado;
  const descripcion = qa?.descripcion?.trim();
  if (descripcion) return descripcion;
  return fallback;
}

/**
 * Elige una imagen de reserva para la categoría. Es determinista y sin red: se
 * usa solo cuando no se ha podido validar ninguna otra candidata.
 *
 * `recentlyUsed` viene ordenado de la más reciente a la más antigua: primero se
 * busca una del pool que no haya salido; si ya han salido todas, se reutiliza
 * **la que hace más tiempo que no se usa** (no siempre la primera, que era lo
 * que provocaba artículos consecutivos con la misma foto).
 */
export function pickFallbackImage(topic?: string, recentlyUsed: string[] = []): string {
  const porCategoria = topic ? FALLBACK_IMAGES[topic] : undefined;
  const pool = porCategoria?.length ? porCategoria : Object.values(FALLBACK_IMAGES).flat();

  const libre = pool.find((url) => !recentlyUsed.includes(url));
  if (libre) return libre;

  let elegida = pool[0];
  let posicionMasAntigua = -1;
  for (const url of pool) {
    const posicion = recentlyUsed.indexOf(url);
    if (posicion > posicionMasAntigua) {
      posicionMasAntigua = posicion;
      elegida = url;
    }
  }
  return (
    elegida ??
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop'
  );
}

/** Busca si esa imagen ya la usó un artículo reciente. */
function findDuplicate(url: string, recentlyUsed: RecentImage[]): string | null {
  return recentlyUsed.find((item) => item.url === url)?.title ?? null;
}

/**
 * Avisos de configuración que explican por qué la cascada se ha quedado corta.
 * Se acumulan en `errors` para que el mensaje de aprobación diga la verdad
 * («falta la clave de Pixabay») en vez de un genérico «falló».
 */
function missingCredentialWarnings(): string[] {
  const avisos: string[] = [];
  if (!process.env.PIXABAY_API_KEY) avisos.push('Pixabay: falta la clave (PIXABAY_API_KEY)');
  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN) {
    avisos.push('Cloudflare: faltan las credenciales (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN)');
  }
  return avisos;
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

/**
 * Valida una candidata y, si pasa el control, la guarda en el almacén
 * permanente. Devuelve null si la candidata no sirve.
 */
async function tryCandidate(
  url: string,
  source: ImageSource,
  stepName: string,
  data: ArticleImageData,
  caption: string,
  attempts: string[],
  errors: string[]
): Promise<ImagePipelineResult | null> {
  const recentImages = data.recentlyUsedImages || [];

  // No se reutiliza una foto que ya ilustró un artículo reciente: se prueba la
  // siguiente candidata. Solo si ninguna es nueva se acaba repitiendo, y en ese
  // caso el resultado lo dice (`duplicateOf`).
  if (findDuplicate(url, recentImages)) {
    logWithTime(`♻️ [${stepName}] Candidata descartada: ya se usó en un artículo reciente`);
    errors.push(`${stepName}: candidata repetida (ya usada)`);
    return null;
  }

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
    caption: resolveCaption(qa, caption),
    qaResult: qa,
    source,
    attempts,
    errors,
    duplicateOf: findDuplicate(finalUrl, recentImages),
  };
}

export async function generateArticleImageAndAnalyzeQA(
  data: ArticleImageData
): Promise<ImagePipelineResult> {
  const attempts: string[] = [];
  const errors: string[] = missingCredentialWarnings();
  const caption = generateCaption(data.title, data.topic);
  const recentImages = data.recentlyUsedImages || [];

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
      const { valid, qa, error } = await isImageValid(
        generated, data.title, data.summary || '', caption, 'Cloudflare'
      );
      if (valid) {
        const finalUrl = await saveImageToSupabase(generated, data.slug);
        return {
          imageUrl: finalUrl,
          caption: resolveCaption(qa, caption),
          qaResult: qa,
          source: 'cloudflare_flux',
          attempts,
          errors,
          duplicateOf: findDuplicate(finalUrl, recentImages),
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
  const fallback = pickFallbackImage(
    data.topic,
    recentImages.map((item) => item.url)
  );
  attempts.push('fallback_static');

  const { valid, qa } = await isImageValid(
    fallback, data.title, data.summary || '', caption, 'reserva'
  );

  if (!valid) {
    logWithTime(
      '⚠️ La imagen de reserva tampoco superó el control de calidad; se publica igualmente para no perder el artículo.'
    );
  }

  const duplicateOf = findDuplicate(fallback, recentImages);
  logWithTime(
    duplicateOf
      ? `♻️ Imagen de reserva repetida (ya usada en «${duplicateOf}»). Errores acumulados: ${errors.join(' | ') || 'ninguno'}`
      : `⚠️ Pipeline de imagen resuelto con la reserva. Errores acumulados: ${errors.join(' | ') || 'ninguno'}`
  );

  return {
    imageUrl: fallback,
    caption: resolveCaption(qa, caption),
    qaResult: qa,
    source: 'fallback_static',
    attempts,
    errors,
    duplicateOf,
  };
}
