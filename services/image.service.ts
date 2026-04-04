import { createClient } from '@supabase/supabase-js';

// Inicializar cliente de Supabase (usamos Service Role Key para poder subir archivos al bucket sin RLS auth)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Unloads the active model from Ollama to free up VRAM for Stable Diffusion
 */
async function unloadOllamaModel() {
  console.log(`🧹 Liberando VRAM de Ollama...`);
  try {
    const psResponse = await fetch("http://localhost:11434/api/ps");
    const psData = await psResponse.json();
    
    if (psData.models && psData.models.length > 0) {
      for (const model of psData.models) {
        console.log(`- Descargando modelo: ${model.name}`);
        await fetch("http://localhost:11434/api/generate", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model.name,
            keep_alive: 0
          })
        });
      }
      // Pequeña espera extra para darle tiempo al Garbage Collector de la GPU de liberar VRAM
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log(`✅ VRAM liberada.`);
    } else {
      console.log(`- Ningún modelo de Ollama cargado en VRAM.`);
    }
  } catch (e) {
    console.error(`❌ Error al intentar liberar VRAM de Ollama:`, e);
  }
}

/**
 * Service to generate images using a local Stable Diffusion API (AUTOMATIC1111)
 */
export async function generateImageLocal(prompt: string, slug: string): Promise<string | null> {
  await unloadOllamaModel();
  const SD_API_URL = "http://127.0.0.1:7860/sdapi/v1/txt2img";

  console.log(`\n🎨 Generando imagen con Stable Diffusion Local...`);
  console.log(`- Prompt: ${prompt.substring(0, 100)}...`);

  try {
    const payload = {
      prompt: `high quality, photorealistic, detailed, 8k, award winning, masterpiece, professional photography, ${prompt}`,
      negative_prompt: "ugly, low quality, bad anatomy, bad proportions, blurry, watermark, text, signature, lowres, error, missing fingers, extra digit, fewer digits, cropped, worst quality, jpeg artifacts",
      steps: 25,
      width: 768,
      height: 512,
      sampler_name: "Euler a",
      cfg_scale: 7
    };

    const response = await fetch(SD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`❌ Error en la API de Stable Diffusion: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.images || data.images.length === 0) {
      console.error("❌ Stable Diffusion no devolvió ninguna imagen.");
      return null;
    }

    const base64Image = data.images[0];
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const fileName = `${slug}.png`;

    console.log(`- Subiendo imagen a Supabase Storage (Bucket: articles)...`);
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('articles')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error(`❌ Error subiendo a Supabase:`, uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase
      .storage
      .from('articles')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;
    console.log(`✅ Imagen subida y disponible en: ${publicUrl}`);

    return publicUrl;

  } catch (error) {
    console.error("❌ Error conectando con Stable Diffusion local:", error);
    return null;
  }
}
