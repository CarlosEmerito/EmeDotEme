/**
 * Stock Image Service — fotografía de archivo con licencia (Pixabay).
 *
 * Es el candidato "limpio legalmente" del pipeline: las fotos de Pixabay se
 * pueden usar con fines comerciales, sin atribución y descargándolas para
 * servirlas desde infraestructura propia (que es lo que hace este proyecto al
 * subirlas a Supabase Storage). A diferencia de las imágenes generadas con IA,
 * son fotos reales: no hay escenas inventadas ni artefactos.
 *
 * Variables de entorno:
 *   PIXABAY_API_KEY  clave gratuita (se obtiene al instante creando una cuenta)
 *
 * Límites del plan gratuito: 100 peticiones por minuto. El pipeline hace una
 * búsqueda por artículo, así que sobra margen.
 */

import 'dotenv/config';
import { logWithTime } from '../../lib/logger';

const PIXABAY_ENDPOINT = 'https://pixabay.com/api/';
const REQUEST_TIMEOUT_MS = 15000;

/** Mínimo de ancho para que la foto aguante el recorte de portada sin pixelarse. */
const MIN_WIDTH = 1000;

export interface PixabayHit {
  largeImageURL?: string;
  webformatURL?: string;
  imageWidth?: number;
  pageURL?: string;
  tags?: string;
}

/**
 * Limpia el título del artículo para usarlo como consulta de búsqueda.
 * Pixabay busca por palabras clave y con relevancia: funciona mejor con pocas
 * palabras significativas que con una frase larga. El tema (la categoría) va
 * primero porque es la señal más fiable; el titular aporta el matiz.
 */
export function buildStockQuery(title: string, topic?: string): string {
  const stopwords = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'en',
    'y', 'o', 'que', 'por', 'para', 'con', 'sin', 'sobre', 'tras', 'the', 'of',
    'in', 'and', 'a', 'an', 'to', 'for', 'on', 'with',
  ]);

  const palabras = (title || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));

  // Cuatro palabras del titular bastan para dar contexto; más ensucian la búsqueda.
  const nucleo = palabras.slice(0, 4);

  const tema = (topic || '').toLowerCase().trim();
  const partes = tema && !nucleo.includes(tema) ? [tema, ...nucleo] : nucleo;

  return partes.join(' ').trim();
}

/**
 * Busca fotos de archivo para ilustrar un artículo.
 * Devuelve hasta `limit` URLs de mayor calidad primero. Nunca lanza.
 */
export async function searchStockImages(
  title: string,
  topic?: string,
  limit = 3
): Promise<string[]> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    logWithTime('⚠️ [Pixabay] Falta PIXABAY_API_KEY: se omite la búsqueda de archivo');
    return [];
  }

  const query = buildStockQuery(title, topic);
  if (!query) return [];

  const params = new URLSearchParams({
    key: apiKey,
    q: query,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: 'true',
    order: 'popular',
    min_width: String(MIN_WIDTH),
    per_page: String(Math.min(Math.max(limit, 1), 20)),
  });

  try {
    logWithTime(`🖼️ [Pixabay] Buscando fotos para: "${query}"`);
    const response = await fetch(`${PIXABAY_ENDPOINT}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      logWithTime(`❌ [Pixabay] HTTP ${response.status}`);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    const hits: PixabayHit[] = Array.isArray(data?.hits) ? data.hits : [];

    const urls = hits
      .map((hit) => hit.largeImageURL || hit.webformatURL)
      .filter((u): u is string => typeof u === 'string' && u.startsWith('http'));

    logWithTime(
      urls.length > 0
        ? `✅ [Pixabay] ${urls.length} candidatas encontradas`
        : '⚠️ [Pixabay] Sin resultados para esa búsqueda'
    );
    return urls.slice(0, limit);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logWithTime(`❌ [Pixabay] Error de red: ${msg}`);
    return [];
  }
}
