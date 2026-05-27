import 'dotenv/config';

const AI_HORDE_API_KEY = process.env.AI_HORDE_API_KEY;
const AI_HORDE_BASE_URL = 'https://aihorde.net/api/v2';
const POLL_INTERVAL_MS = 6000;
const MAX_POLL_TRIES = 60;

export interface AIHordeImageOptions {
  width?: number;
  height?: number;
  steps?: number;
  sampler_name?: string;
  n?: number;
  karras?: boolean;
  qualityToggle?: boolean;
  upscale?: boolean;
  negative_prompt?: string;
}

export async function generateImageWithAIHorde(
  prompt: string,
  articleSlug: string,
  options: AIHordeImageOptions = {}
): Promise<string | null> {
  if (!AI_HORDE_API_KEY) {
    console.error('❌ [AI HORDE] API key no configurada en .env (AI_HORDE_API_KEY)');
    return null;
  }

  const negativePrompt = options.negative_prompt ||
    '(worst quality, low quality, normal quality, lowres, low details, grayscale), text, watermark, logo, signature, words, handwriting, calligraphy, Chinese characters, captions, subtitles, labels, numbers, English characters, nsfw, bad anatomy, bad hands, missing fingers, extra digits, cropped, jpeg artifacts, blurry';

  const width = options.width || 1024;
  const height = options.height || 1024;
  const steps = options.steps || 50;
  const sampler = options.sampler_name || 'k_dpmpp_2m';

  // AI Horde v2 uses '###' delimiter in the prompt for negative guidance
  // Prepend quality keywords to the positive prompt
  const qualityPrompt = `masterpiece, best quality, highly detailed, 8k resolution, cinematic lighting, ${prompt} ### ${negativePrompt}`;

  const payload = {
    prompt: qualityPrompt,
    params: {
      width,
      height,
      steps,
      sampler_name: sampler,
      n: options.n || 1,
      karras: options.karras !== undefined ? options.karras : true,
      qualityToggle: options.qualityToggle !== undefined ? options.qualityToggle : true,
      hires_fix: true,
    },
    nsfw: false,
    censor_nsfw: true,
    r2: true,
    shared: false,
    models: ['AlbedoBase XL (SDXL)', 'Juggernaut XL', 'DreamShaper', 'Deliberate'],
  };

  console.log(`[AI HORDE] Generando imagen para: ${articleSlug}`);
  console.log(`[AI HORDE] Prompt (${prompt.length} chars): ${prompt.substring(0, 80)}...`);

  try {
    const response = await fetch(`${AI_HORDE_BASE_URL}/generate/async`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': AI_HORDE_API_KEY,
        'Client-Agent': 'emedoteme/1.0',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [AI HORDE] Error HTTP ${response.status}: ${errorText}`);
      return null;
    }

    const data = await response.json() as { id: string; message?: string };
    
    if (!data.id) {
      console.error('❌ [AI HORDE] No se recibió ID de generación:', data);
      return null;
    }

    console.log(`[AI HORDE] Job creado: ${data.id}`);
    if (data.message) {
      console.log(`[AI HORDE] Mensaje: ${data.message}`);
    }

    let tries = 0;
    let imageUrl: string | null = null;
    let isFinished = false;

    while (tries < MAX_POLL_TRIES && !imageUrl && !isFinished) {
      await new Promise(res => setTimeout(res, POLL_INTERVAL_MS));
      
      try {
        const poll = await fetch(`${AI_HORDE_BASE_URL}/generate/status/${data.id}`, {
          headers: {
            'apikey': AI_HORDE_API_KEY,
            'Client-Agent': 'emedoteme/1.0',
          },
        });

        if (!poll.ok) {
          console.warn(`⚠️ [AI HORDE] Polling error ${poll.status}, reintentando...`);
          tries++;
          continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pollData = await poll.json() as any;
        
        if (pollData.is_possible === false) {
          console.error(`❌ [AI HORDE] Generación imposible: ${pollData.errors?.join(', ')}`);
          return null;
        }

        if (pollData.generations && pollData.generations.length > 0) {
          const kudosUsed = pollData.generations[0].kudos ?? pollData.kudos ?? 0;
          
          if (typeof kudosUsed === 'number' && kudosUsed >= 10) {
            console.log(`[AI HORDE] Kudos usados: ${kudosUsed}`);
            imageUrl = pollData.generations[0].img;
          } else {
            console.warn(`⚠️ [AI HORDE] Kudos insuficientes (${kudosUsed}), descartando imagen`);
          }
        }

        if (pollData.done === true || pollData.failed === true) {
          isFinished = true;
          if (pollData.failed) {
            console.error(`❌ [AI HORDE] Job falló: ${pollData.fail_reason}`);
          }
        }

        tries++;
        if (!imageUrl && !isFinished) {
          console.log(`[AI HORDE] Esperando... (${tries}/${MAX_POLL_TRIES})`);
        }
      } catch (pollErr) {
        console.warn(`⚠️ [AI HORDE] Error en polling: ${pollErr}`);
        tries++;
      }
    }

    if (!imageUrl) {
      console.error(`❌ [AI HORDE] Timeout después de ${MAX_POLL_TRIES * POLL_INTERVAL_MS / 1000}s`);
    }

    return imageUrl;
  } catch (err) {
    console.error('❌ [AI HORDE] Error:', err);
    return null;
  }
}

export async function checkAIHordeStatus(): Promise<{ ok: boolean; workers: number; queued: number }> {
  if (!AI_HORDE_API_KEY) {
    console.error('❌ [AI HORDE] API key no configurada');
    return { ok: false, workers: 0, queued: 0 };
  }

  try {
    const response = await fetch(`${AI_HORDE_BASE_URL}/status`, {
      headers: {
        'apikey': AI_HORDE_API_KEY,
        'Client-Agent': 'emedoteme/1.0',
      },
    });

    if (!response.ok) {
      console.error(`❌ [AI HORDE] Status error ${response.status}`);
      return { ok: false, workers: 0, queued: 0 };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await response.json() as any;
    return {
      ok: true,
      workers: data.workers?.length ?? 0,
      queued: data.queued ?? 0,
    };
  } catch (err) {
    console.error('❌ [AI HORDE] Status check failed:', err);
    return { ok: false, workers: 0, queued: 0 };
  }
}