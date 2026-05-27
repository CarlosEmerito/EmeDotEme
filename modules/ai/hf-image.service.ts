import 'dotenv/config';

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL_URL = 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell';
const MAX_RETRIES = 3;

/**
 * Genera una imagen utilizando la Inference API de Hugging Face de forma gratuita.
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

  // Enhancing the prompt for better stylistic results
  const qualityPrompt = `high quality, detailed, professional journalistic illustration, ${prompt}`;

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      const response = await fetch(HF_MODEL_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: qualityPrompt,
          parameters: {
            // Some optional parameters supported by HF text-to-image API
            guidance_scale: 3.5,
            num_inference_steps: 4,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [HF API] Error HTTP ${response.status}: ${errorText}`);
        
        // Handle model loading error (503 Service Unavailable)
        if (response.status === 503) {
          console.log(`⚠️ [HF API] El modelo se está cargando. Reintentando en 10s...`);
          await new Promise(res => setTimeout(res, 10000));
          attempt++;
          continue;
        }
        return null;
      }

      // Read response as ArrayBuffer
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      console.log(`✅ [HF API] Imagen generada con éxito (${base64.length} bytes)`);
      return `data:${contentType};base64,${base64}`;
    } catch (error) {
      console.error(`❌ [HF API] Error en la petición:`, error);
      attempt++;
      await new Promise(res => setTimeout(res, 2000));
    }
  }

  console.error(`❌ [HF API] Fallaron todos los intentos de generación`);
  return null;
}
