import 'dotenv/config';

const FLUX_API_URL = process.env.FLUX_API_URL || 'http://127.0.0.1:8000';

export interface FluxImageOptions {
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
}

/**
 * Genera una imagen utilizando la API local de Flux.1
 */
export async function generateImageWithFlux(
  prompt: string,
  articleSlug: string,
  options: FluxImageOptions = {}
): Promise<string | null> {
  console.log(`[FLUX LOCAL] Generando imagen para: ${articleSlug}`);
  console.log(`   💡 Puedes seguir el progreso con: docker logs -f flux-api-server`);
  
  const payload = {
    prompt,
    width: options.width || 896,
    height: options.height || 896,
    num_inference_steps: options.num_inference_steps || 28,
    guidance_scale: options.guidance_scale || 3.5,
  };

  try {
    // Flux [dev] en 8GB puede tardar bastante, ponemos un timeout generoso (20 min)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200000);

    const response = await fetch(`${FLUX_API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signal: controller.signal as any,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [FLUX LOCAL] Error HTTP ${response.status}: ${errorText}`);
      return null;
    }

    const data = await response.json() as { image_b64: string; format: string };
    
    if (!data.image_b64) {
      console.error('❌ [FLUX LOCAL] No se recibió la imagen en base64');
      return null;
    }

    // Guardar temporalmente para que el pipeline pueda procesarla (o devolver el base64 data URI)
    const dataUri = `data:image/${data.format};base64,${data.image_b64}`;
    
    console.log(`✅ [FLUX LOCAL] Imagen generada con éxito.`);
    return dataUri;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error('❌ [FLUX LOCAL] Timeout alcanzado durante la generación.');
    } else {
      console.error('❌ [FLUX LOCAL] Error llamando a la API local:', err);
    }
    return null;
  }
}

/**
 * Verifica si el servicio local de Flux está disponible.
 * Si el contenedor está corriendo pero no responde, espera hasta 60s.
 */
export async function checkFluxStatus(): Promise<boolean> {
  const maxWaitMs = 60000;
  const intervalMs = 5000;
  let elapsedMs = 0;

  while (elapsedMs < maxWaitMs) {
    try {
      const response = await fetch(`${FLUX_API_URL}/health`, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signal: AbortSignal.timeout(3000) as any
      });
      if (response.ok) return true;
    } catch {
      console.log(`[FLUX] Esperando respuesta del servidor (${elapsedMs/1000}s)...`);
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    elapsedMs += intervalMs;
  }
  
  return false;
}
