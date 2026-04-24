import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

/**
 * Servicio de almacenamiento en Supabase Storage.
 */

/**
 * Sube una imagen externa a Supabase Storage y retorna la URL pública permanente.
 * Si falla o no hay credenciales, retorna la URL original.
 */
export async function saveImageToSupabase(url: string, slug: string): Promise<string> {
  // Skip si ya es una URL permanente o local
  const permanentDomains = ['images.unsplash.com', 'supabase.co', 'supabase.com', 'emedoteme.es'];
  try {
    const urlObj = new URL(url);
    if (permanentDomains.some(d => urlObj.hostname.includes(d))) return url;
  } catch { /* no es una URL válida o no está en la lista blanca */ }

  if (url.includes('supabase.co/storage/v1/object/public/')) return url;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Storage] Supabase: Credenciales no configuradas, usando URL original');
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
      console.error('[Storage] Supabase Upload Error:', error);
      return url;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('[Storage] Supabase Exception:', error);
    return url;
  }
}
