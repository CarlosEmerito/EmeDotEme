/**
 * Cloudflare Image Service — generación de imágenes con Workers AI (FLUX.1-schnell).
 *
 * Sustituye a Hugging Face, cuya capa gratuita dejó de cubrir el proyecto
 * (HTTP 402: créditos agotados). Cloudflare ofrece 10.000 *neurons* al día de
 * forma gratuita, sin fecha de caducidad y con reinicio diario. Una imagen de
 * 1024x1024 con los ajustes por defecto cuesta ~57,6 neurons, así que la
 * asignación diaria da para unas 170 imágenes, muy por encima del consumo real
 * del pipeline (unas 2 al día).
 *
 * La imagen se devuelve como Data URI, igual que hacía el servicio anterior,
 * para que el control de calidad con Gemini Vision pueda analizarla antes de
 * subirla a Supabase Storage.
 *
 * Variables de entorno:
 *   CLOUDFLARE_ACCOUNT_ID  identificador de la cuenta (panel de Cloudflare)
 *   CLOUDFLARE_API_TOKEN   token con permiso "Workers AI: Read"
 */

import 'dotenv/config';
import { logWithTime } from '../../lib/logger';

const MODEL = '@cf/black-forest-labs/flux-1-schnell';
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 90000;

/** Pasos de difusión. FLUX.1-schnell está pensado para pocos pasos (4 por defecto). */
const DEFAULT_STEPS = 4;

/** Prompt de calidad común, en inglés: es el idioma con el que rinde mejor el modelo. */
const QUALITY_PREFIX =
  'photorealistic, professional press photograph, editorial photography, ' +
  'sharp focus, natural lighting, realistic textures, 4k quality, ' +
  'no watermarks, no text, no logos, no captions';

const QUALITY_SUFFIX = ', documentary style, high detail, no text overlays';

export interface CloudflareImageOptions {
  steps?: number;
}

/**
 * Genera una imagen con FLUX.1-schnell en Cloudflare Workers AI.
 * Devuelve un Data URI listo para el control de calidad, o null si no se pudo.
 * Nunca lanza.
 */
export async function generateImageWithCloudflare(
  prompt: string,
  options: CloudflareImageOptions = {}
): Promise<string | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    logWithTime(
      '⚠️ [Cloudflare] Faltan CLOUDFLARE_ACCOUNT_ID o CLOUDFLARE_API_TOKEN: se omite la generación'
    );
    return null;
  }

  if (!prompt || !prompt.trim()) {
    logWithTime('⚠️ [Cloudflare] Prompt vacío: se omite la generación');
    return null;
  }

  const steps = options.steps ?? DEFAULT_STEPS;
  const fullPrompt = `${QUALITY_PREFIX}, ${prompt.trim()}${QUALITY_SUFFIX}`;
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`;

  logWithTime(`🎨 [Cloudflare] Generando imagen (${MODEL}, ${steps} pasos)...`);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: fullPrompt, steps }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      const bodyText = await response.text();

      if (!response.ok) {
        logWithTime(
          `❌ [Cloudflare] HTTP ${response.status}: ${bodyText.substring(0, 200)}`
        );

        // 429 (límite de peticiones) y 5xx son transitorios: merece la pena reintentar.
        // 401/403 (token inválido) y 400 (petición mal formada) no mejoran solos.
        if (response.status === 429 || response.status >= 500) {
          if (attempt < MAX_RETRIES) {
            const espera = 5000 * (attempt + 1);
            logWithTime(`⚠️ [Cloudflare] Reintentando en ${espera / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, espera));
            continue;
          }
        }

        // 4006 = asignación diaria de neurons agotada. Se reinicia a las 00:00 UTC.
        if (bodyText.includes('4006')) {
          logWithTime(
            '⚠️ [Cloudflare] Asignación diaria de neurons agotada. Se reinicia a las 00:00 UTC.'
          );
        }
        return null;
      }

      // La respuesta correcta es JSON con la imagen en base64 dentro de `result.image`.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parsed: any;
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        logWithTime('❌ [Cloudflare] La respuesta no es JSON válido');
        return null;
      }

      const base64 = parsed?.result?.image;
      if (typeof base64 !== 'string' || base64.length < 1000) {
        logWithTime(
          `❌ [Cloudflare] Respuesta sin imagen utilizable: ${bodyText.substring(0, 200)}`
        );
        return null;
      }

      logWithTime(`✅ [Cloudflare] Imagen generada (${Math.round(base64.length / 1024)} KB en base64)`);
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logWithTime(`❌ [Cloudflare] Error de red: ${msg}`);
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      }
      return null;
    }
  }

  return null;
}
