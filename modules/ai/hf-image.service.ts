import 'dotenv/config';

const HF_TOKEN = process.env.HF_TOKEN;

// Modelos en orden de preferencia — se prueban en secuencia hasta que uno funcione.
// stable-diffusion-3-medium-diffusers es (a fecha de este comentario) el único
// modelo text-to-image servido por el proveedor hf-inference de Hugging Face.
// Verificar antes de añadir otros: GET https://huggingface.co/api/models?pipeline_tag=text-to-image&inference_provider=hf-inference
const HF_MODELS = [
  'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-3-medium-diffusers',
];
const MAX_RETRIES = 2;

// Prompt de calidad que se antepone a todas las descripciones de imagen.
// Optimizado para FLUX.1-schnell: fotorrealista, periodístico, sin estética cyberpunk.
const QUALITY_PREFIX = 'photorealistic, high resolution, professional press photograph, editorial photography, sharp focus, natural lighting, 4k quality, realistic textures, no watermarks, no text overlays';

// Negative prompt: elementos a evitar en todas las generaciones.
// FLUX.1-schnell no admite negative_prompt directamente en inputs, pero se puede incluir en el prompt.
const QUALITY_SUFFIX = ', hyperdetailed, award-winning photograph, documentary style';

/**
 * Intenta generar una imagen con un modelo HF concreto.
 * Devuelve null si el modelo está deprecado (410), sin créditos (402),
 * o si todos los reintentos transitorios (503) se agotan.
 */
async function tryModel(modelUrl: string, qualityPrompt: string): Promise<string | null> {
  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    try {
      const response = await fetch(modelUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: qualityPrompt }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [HF API] Error HTTP ${response.status} (${modelUrl.split('/').pop()}): ${errorText.substring(0, 200)}`);

        if (response.status === 503) {
          // El modelo se está cargando — reintentar con espera
          console.log(`⚠️ [HF API] Modelo cargando. Reintentando en 15s... (intento ${attempt + 1}/${MAX_RETRIES})`);
          await new Promise(res => setTimeout(res, 15000));
          attempt++;
          continue;
        }

        // 410 = Deprecated, 402 = Sin créditos, 404 = No encontrado → pasar al siguiente modelo
        return null;
      }

      // Verificar que la respuesta es una imagen (no un JSON de error)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json = await response.json() as any;
        console.error(`❌ [HF API] Respuesta JSON inesperada:`, JSON.stringify(json).substring(0, 200));
        return null;
      }

      const buffer = await response.arrayBuffer();
      if (buffer.byteLength < 1000) {
        console.error(`❌ [HF API] Respuesta demasiado pequeña (${buffer.byteLength} bytes), probablemente un error.`);
        return null;
      }

      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = contentType.split(';')[0] || 'image/jpeg';
      console.log(`✅ [HF API] Imagen generada (${(buffer.byteLength / 1024).toFixed(0)} KB, modelo: ${modelUrl.split('/').pop()})`);
      return `data:${mimeType};base64,${base64}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(`❌ [HF API] Error de red en la petición:`, error.message);
      attempt++;
      await new Promise(res => setTimeout(res, 3000));
    }
  }
  return null;
}

/**
 * Genera una imagen utilizando la Inference API de Hugging Face.
 * Prueba los modelos en orden hasta que uno funcione.
 * Retorna la imagen en formato Data URI (base64) para que pueda ser validada
 * por Gemini Vision y luego subida a Supabase.
 */
export async function generateImageWithHuggingFace(
  prompt: string,
  articleSlug: string
): Promise<string | null> {
  if (!HF_TOKEN) {
    console.error('❌ [HF API] No hay HF_TOKEN configurado en .env');
    return null;
  }

  console.log(`🎨 [HF API] Generando imagen para: ${articleSlug}`);
  console.log(`🎨 [HF API] Prompt: ${prompt.substring(0, 100)}...`);

  const qualityPrompt = `${QUALITY_PREFIX}, ${prompt}${QUALITY_SUFFIX}`;

  for (const modelUrl of HF_MODELS) {
    const modelName = modelUrl.split('/').slice(-2).join('/');
    console.log(`🎨 [HF API] Probando modelo: ${modelName}`);
    const result = await tryModel(modelUrl, qualityPrompt);
    if (result) return result;
    console.warn(`⚠️ [HF API] Modelo ${modelName} no funcionó, probando siguiente...`);
  }

  console.error(`❌ [HF API] Todos los modelos de HuggingFace fallaron.`);
  return null;
}
