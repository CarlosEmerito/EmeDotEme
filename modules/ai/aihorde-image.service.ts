import 'dotenv/config';
// ... (resto de la lógica igual que en el archivo original)

// Configuración de AI Horde API
const AI_HORDE_API_KEY = process.env.AI_HORDE_API_KEY || "te_N7fz_XZR6OydOwLLL0w";
const AI_HORDE_BASE_URL = "https://aihorde.net/api/v2";

// Models to priorizar...
// ...

export interface AIHordeImageOptions {
  width?: number;
  height?: number;
  steps?: number;
  sampler_name?: string;
  n?: number;
  karras?: boolean;
  qualityToggle?: boolean;
  upscale?: boolean;
  negative_prompt?: string; // Added for explicit negative prompt control
}

export interface AIHordeGenerationStatus {
  // ...
}

export interface AIHordeAsyncRequest {
  // ...
}

export async function generateImageWithAIHorde(
  prompt: string,
  articleSlug: string,
  options: AIHordeImageOptions = {}
): Promise<string | null> {
  // Lógica para generar imagen de alta calidad usando AI Horde
  try {
        // --- AUTO-CONFIG FOR MAXIMUM QUALITY AND TEXT SUPPRESSION ---
    // If options.negative_prompt provided, use it; otherwise, use best-practice default
    const negativePrompt = options.negative_prompt ||
      "letter, text, watermark, logo, signature, words, handwriting, calligraphy, Chinese characters, captions, subtitles, labels, numbers, English characters, nsfw, lowres, bad anatomy, bad hands, missing fingers, extra digits, cropped, worst quality, low quality, jpeg artifacts";
    // Prefer square 1024 for SDXL quality unless overridden
    const width = options.width || 1024;
    const height = options.height || 1024;
    const steps = options.steps || 70; // Subido a 70 para máximo detalle y realismo
    // Preferred samplers for realism and stability
    const sampler = options.sampler_name || 'k_dpmpp_2m';

    const payload = {
      prompt,
      negative_prompt: negativePrompt,
      params: {
        width: width,
        height: height,
        steps: steps,
        sampler_name: sampler,
        n: options.n || 1,
        karras: options.karras !== undefined ? options.karras : true,
        qualityToggle: options.qualityToggle !== undefined ? options.qualityToggle : true,
        upscale: options.upscale !== undefined ? options.upscale : true, // high-res two-step
        // NOTE: If 'single_pass' param available, set to false/prefer two-stage process for quality
        // single_pass: options.single_pass !== undefined ? options.single_pass : false,
      },
      nsfw: false,
      censor_nsfw: true,
      r2: true,
      shared: false,
      models: ["SDXL", "RealisticVision", "Deliberate"], // Strictly prioritize premium/photo-real models
    };
    // --- END AUTO-CONFIG ---
    console.log(`[AI HORDE] Negative prompt enviado (${articleSlug}):\n${negativePrompt}`); // Logging explícito
    const response = await fetch(`${AI_HORDE_BASE_URL}/generate/async`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': AI_HORDE_API_KEY,
        'Client-Agent': 'emedoteme/1.0',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const { id } = data;
    // Polling para esperar la imagen generada
    let tries = 0;
    let imageUrl = null;
    while (tries < 30 && !imageUrl) {
      await new Promise(res => setTimeout(res, 4000));
      const poll = await fetch(`${AI_HORDE_BASE_URL}/generate/status/${id}`, {
        headers: {
          'apikey': AI_HORDE_API_KEY,
          'Client-Agent': 'emedoteme/1.0',
        },
      });
      if (!poll.ok) continue;
      const pollData = await poll.json();
      if (pollData.generations && pollData.generations.length > 0) {
        // Detectar kudos usados
        const kudosUsed = pollData.generations[0].kudos ?? pollData.kudos ?? 0;
        if (typeof kudosUsed !== 'number' || kudosUsed < 10) {
          console.warn(`[AI HORDE - BLOQUEADA] Imagen descartada por kudos bajos (${kudosUsed}) para slug: ${articleSlug}\nPrompt: ${prompt}`);
          imageUrl = null; // fuerza fallback
        } else {
          console.log(`[AI HORDE] Kudos usados: ${kudosUsed} para slug: ${articleSlug}`);
          imageUrl = pollData.generations[0].img;
        }
      }
      tries++;
    }
    return imageUrl;
  } catch (e) {
    return null;
  }
}
