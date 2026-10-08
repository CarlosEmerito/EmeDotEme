import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

/**
 * Servicio de almacenamiento en Supabase Storage.
 */

/**
 * Fuentes cuya imagen el proyecto **puede** descargar y volver a alojar, porque
 * su licencia lo permite: fotografía de archivo con licencia comercial (Pixabay,
 * Pexels, Unsplash), el propio almacén y el propio dominio.
 */
const ALLOWED_TO_STORE = [
  'pixabay.com',
  'pexels.com',
  'images.unsplash.com',
  'supabase.co',
  'supabase.com',
  'emedoteme.es',
];

/**
 * ¿Se puede descargar y volver a alojar esta imagen?
 *
 * - Los Data URI vienen de la generación con IA: son nuestros.
 * - Las fuentes de la lista blanca tienen licencia de uso comercial.
 * - Todo lo demás (imágenes de prensa, agencias, redes sociales) **no**.
 *
 * Exportada para poder probarla sin red.
 */
export function isAllowedToStore(url: string): boolean {
  if (url.startsWith('data:')) return true;
  try {
    const hostname = new URL(url).hostname;
    return ALLOWED_TO_STORE.some((d) => hostname === d || hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

/**
 * Sube una imagen a Supabase Storage y retorna la URL pública permanente.
 *
 * **No se copia ninguna imagen de terceros.** El art. 129 bis.2 del TRLPI sujeta
 * a autorización la puesta a disposición del público de cualquier imagen de una
 * publicación de prensa; descargarla y volver a alojarla añade una reproducción
 * a esa puesta a disposición. Si llega una URL de una fuente que no está en la
 * lista blanca, se devuelve tal cual —sin copiarla— y se avisa en los registros,
 * porque significa que algo se ha colado en la cascada de imágenes.
 *
 * Si falla o no hay credenciales, retorna la URL original.
 */
export async function saveImageToSupabase(url: string, slug: string): Promise<string> {
  // Si ya es una URL permanente nuestra, no hay nada que copiar.
  if (url.includes('supabase.co/storage/v1/object/public/')) return url;

  if (!isAllowedToStore(url)) {
    let hostname = '(no parseable)';
    try {
      hostname = new URL(url).hostname;
    } catch {
      /* se queda el marcador */
    }
    console.error(
      `[Storage] ⚠️ Imagen de una fuente no autorizada (${hostname}): NO se copia. ` +
        `Solo se re-alojan imágenes propias o con licencia (${ALLOWED_TO_STORE.join(', ')}). ` +
        `Comprueba la cascada de modules/images/image.service.ts.`
    );
    return url;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Storage] Supabase: Credenciales no configuradas, usando URL original');
    return url;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const bucketName = 'article-images';

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let buffer: any;
    let contentType = 'image/webp';
    let extension = 'webp';

    if (url.startsWith('data:')) {
      const parts = url.split(',');
      const header = parts[0];
      const base64Data = parts[1];
      
      const mimeMatch = header.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
      if (mimeMatch && mimeMatch[1]) {
        contentType = mimeMatch[1];
      }
      extension = contentType.split('/')[1] || 'jpeg';
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/*',
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      buffer = await response.arrayBuffer();
      contentType = response.headers.get('content-type') || 'image/webp';
      extension = contentType.split('/')[1] || 'webp';
    }

    const fileName = `${slug}-${Date.now()}.${extension}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, Buffer.from(buffer), { contentType, upsert: false });

    if (error) {
      console.error('[Storage] Supabase Upload Error:', error);
      // Si la URL original es un Data URI o local, NO la devolvemos porque fallaría en producción
      if (url.startsWith('data:') || url.includes('localhost') || url.includes('127.0.0.1')) {
        return 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop'; // Fallback genérico tech
      }
      return url;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    // Verificación de seguridad: si no hay publicUrl, devolvemos el fallback
    if (!publicUrl) {
       console.error('[Storage] Supabase: Falló la generación de PublicURL');
       return 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop';
    }

    return publicUrl;
  } catch (error) {
    console.error('[Storage] Supabase Exception:', error);
    return url;
  }
}
