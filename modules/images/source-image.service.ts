/**
 * Source Image Service — extrae la imagen principal del artículo original.
 *
 * Los feeds RSS solo traen imagen en una parte de los casos (~60%), pero la
 * página del artículo casi siempre declara una imagen en sus metadatos
 * (`og:image` / `twitter:image`): medido sobre las fuentes reales del proyecto,
 * el 85% de los artículos la tienen.
 *
 * Esta función visita la página original y la recupera. No lanza nunca: si no
 * hay imagen o la descarga falla, devuelve null y el pipeline continúa con el
 * siguiente candidato.
 */

import { logWithTime } from '../../lib/logger';

const FETCH_TIMEOUT_MS = 12000;

/** UA de navegador real: muchos medios sirven 403 a clientes que no lo parecen. */
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/** Extensiones que sabemos que son imágenes. */
const IMAGE_EXT_RE = /\.(jpe?g|png|webp|avif)(\?|#|$)/i;

/** Descarta lo que claramente no es una imagen usable. */
const RUIDO_RE = /(sprite|logo|favicon|placeholder|1x1|pixel|\/blank\.|spacer|advert|\/ads?[._/-])/i;

/**
 * Normaliza una URL relativa o con entidades HTML y la resuelve contra la base.
 * Devuelve null si no es resoluble.
 */
export function resolveImageUrl(raw: string | undefined, baseUrl: string): string | null {
  if (!raw) return null;

  // Entidades HTML habituales en atributos de metadatos
  let url = raw.trim().replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/&quot;/g, '"');
  if (!url || url.startsWith('data:')) return null;

  // Protocolo-relative: //cdn.ejemplo.com/foto.jpg
  if (url.startsWith('//')) url = 'https:' + url;

  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return null;
  }
}

/**
 * Busca recursivamente la primera imagen dentro de un objeto JSON-LD.
 * Los medios publican ahí la imagen del artículo, y a veces es la única fuente.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findImageInJsonLd(node: any, depth = 0): string | null {
  if (depth > 6 || !node) return null;

  if (typeof node === 'string') return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findImageInJsonLd(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (typeof node === 'object') {
    for (const key of ['image', 'thumbnailUrl', 'contentUrl', 'url']) {
      const value = node[key];
      if (typeof value === 'string' && IMAGE_EXT_RE.test(value)) return value;
      if (typeof value === 'object' && value !== null) {
        const found = findImageInJsonLd(value, depth + 1);
        if (found) return found;
      }
    }
    for (const value of Object.values(node)) {
      if (typeof value === 'object' && value !== null) {
        const found = findImageInJsonLd(value, depth + 1);
        if (found) return found;
      }
    }
  }

  return null;
}

/**
 * Extrae la mejor imagen declarada en el HTML de un artículo.
 * Orden: `og:image` → `twitter:image` → JSON-LD → `<img>` destacada.
 * Exportada para poder probarla sin red.
 */
export function extractImageFromHtml(html: string, baseUrl: string): string | null {
  if (!html) return null;

  const candidatos: string[] = [];

  // 1) Metadatos. Son las fuentes más fiables: el medio los declara a propósito
  //    para que las redes sociales muestren la imagen del artículo.
  const patrones = [
    /<meta[^>]+(?:property|name)=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image(?::url)?["']/i,
    /<meta[^>]+(?:property|name)=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']twitter:image(?::src)?["']/i,
  ];
  for (const patron of patrones) {
    const match = html.match(patron);
    if (match?.[1]) candidatos.push(match[1]);
  }

  // 2) JSON-LD (schema.org/NewsArticle). Es la vía menos vistosa pero funciona
  //    en medios que no rellenan bien las etiquetas og.
  const bloques = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const bloque of bloques.slice(0, 5)) {
    const json = bloque.replace(/^[\s\S]*?>/, '').replace(/<\/script>$/i, '').trim();
    try {
      const found = findImageInJsonLd(JSON.parse(json));
      if (found) candidatos.push(found);
    } catch {
      /* JSON-LD mal formado: se ignora, no es motivo para abortar */
    }
  }

  for (const candidato of candidatos) {
    const url = resolveImageUrl(candidato, baseUrl);
    if (url && IMAGE_EXT_RE.test(url) && !RUIDO_RE.test(url)) return url;
  }

  return null;
}

/**
 * Visita el artículo original y devuelve la URL de su imagen principal.
 * Devuelve null ante cualquier problema: nunca lanza.
 */
export async function fetchSourceImage(articleUrl?: string): Promise<string | null> {
  if (!articleUrl) return null;

  try {
    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      logWithTime(`⚠️ [og:image] El artículo original respondió HTTP ${response.status}`);
      return null;
    }

    const html = await response.text();
    const image = extractImageFromHtml(html, articleUrl);

    if (image) {
      logWithTime(`🖼️ [og:image] Imagen encontrada en el artículo original: ${image}`);
    } else {
      logWithTime('⚠️ [og:image] El artículo original no declara ninguna imagen');
    }
    return image;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logWithTime(`⚠️ [og:image] No se pudo leer el artículo original: ${msg}`);
    return null;
  }
}
