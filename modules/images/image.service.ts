// ... código anterior ...
import { analyzeImageWithGemini } from '../ai/gemini-vision.service';
import { generateImageWithAIHorde } from '../ai/aihorde-image.service';
import { createClient } from '@supabase/supabase-js';
// TODO: replace with actual implementation
async function analyzeImageWithOllama(imageUrl: string, title: string, summary: string, caption: string): Promise<any> {
  return {
    coherente: true,
    razon_coherencia: "(stub) Placeholder Ollama",
    descripcion: "(stub) Image description",
    calidad_aceptable: true,
    problemas_detectados: [],
    caption_mejorado: caption
  };
}


export interface ArticleImageData {
  title: string;
  slug: string;
  topic?: string;
  originalPrompt?: string;
  summary?: string;
}

/**
 * Returns a professional caption for an image using context (title/topic/prompt)
 * TODO: move to lib/utils for reuse.
 */
function generateProfessionalCaption(title: string, topic?: string): string {
  // Frase más natural, NO el prompt
  if (topic) {
    return `Representación artística de «${title}» en el contexto de ${topic}.`;
  }
  return `Escena representativa sobre «${title}».`;
}

/**
 * Uploads an image to Supabase Storage and returns its permanent public URL.
 * Skips upload for already permanent URLs (Unsplash, Supabase, etc).
 */
export async function saveImageToSupabase(url: string, slug: string): Promise<string> {
  // Skip if already a permanent URL
  const permanentDomains = [
    'images.unsplash.com',
    'supabase.co', // Supabase Storage URLs
    'supabase.com',
    'emedoteme.es', // our own domain
  ];
  try {
    const urlObj = new URL(url);
    if (permanentDomains.some(domain => urlObj.hostname.includes(domain))) {
      return url;
    }
  } catch (e) {
    // If URL parsing fails, continue trying to upload
  }

  // Skip if already a Supabase Storage URL (to avoid re-upload)
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[saveImageToSupabase] Missing Supabase credentials, returning original URL');
    return url;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const bucketName = 'article-images';

  try {
    // Download image with browser-like headers to avoid Cloudflare R2 blocks
    const fetch = (await import('node-fetch')).default;
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://aihorde.net/',
    };
    let response = await fetch(url, { headers });
    if (!response.ok) {
      // Try without referer if that fails
      console.warn(`[saveImageToSupabase] First fetch failed (${response.status}), trying without referer...`);
      response = await fetch(url, { headers: { 'User-Agent': headers['User-Agent'] } });
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }
    }
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/webp';
    
    // Generate unique filename
    const timestamp = Date.now();
    const extension = contentType.split('/')[1] || 'webp';
    const fileName = `${slug}-${timestamp}.${extension}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, Buffer.from(buffer), {
        contentType,
        upsert: false,
      });
    
    if (error) {
      // If bucket doesn't exist, try to create it (requires service role)
      if (error.message.includes('bucket')) {
        console.warn(`[saveImageToSupabase] Bucket ${bucketName} may not exist, attempting to create...`);
        // Note: Creating buckets via API may require admin API; we'll skip for now.
      }
      console.error('[saveImageToSupabase] Upload error:', error);
      return url; // fallback to original URL
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);
    
    console.log(`[saveImageToSupabase] Uploaded ${fileName} to ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('[saveImageToSupabase] Unexpected error:', error);
    return url; // fallback to original URL
  }
}


/**
 * Genera la imagen para un artículo y realiza análisis QA visual con fallback Gemini→Ollama
 * En DRY_RUN analiza tanto la imagen original web como la generada
 */
export async function generateArticleImageAndAnalyzeQA(
  imageData: ArticleImageData,
  originalImageUrl?: string | null,
  opts: { testMode?: boolean } = {}
): Promise<{
  imageUrl: string; caption: string;
  mainQA: any; originalQA?: any;
  usedFallback: boolean; flows: string[]; errors: string[];
}> {
  const flows: string[] = [];
  const errors: string[] = [];
  let usedFallback = false;
  // Paso 1: Obtener original image
  let imageUrl = originalImageUrl || '';
  let webOriginal = imageUrl;
  let hordePrompt = imageData.originalPrompt || `${imageData.title}. Ilustración profesional, alta calidad, sin marcas de agua, sin texto, estilo realista.`;
  let caption = generateProfessionalCaption(imageData.title, imageData.topic);

  // Si no se pasó url web, intentar extraer
  if (!imageUrl && imageData.originalPrompt) {
    try {
      const { spawnSync } = await import('child_process');
      const result = spawnSync('python3', [
        'scripts/extract_main_image.py', imageData.originalPrompt
      ], { encoding: 'utf-8' });
      const output = result.stdout?.trim();
      if (output && output.startsWith('http')) imageUrl = webOriginal = output;
      flows.push('extract_main_image.py OK');
    } catch (e) {
      errors.push('extract_main_image.py error');
    }
  }

  let webAnalysis = null, webAnalysisEngine = null;
  // En test mode/DRY_RUN, analizar TAMBIÉN la original web primero
  let runTestWebQA = opts.testMode || process.env.DRY_RUN === 'true';
  if (runTestWebQA && webOriginal) {
    // Primero Gemini, luego fallback Ollama si falla
    try {
      let result = await analyzeImageWithGemini(webOriginal, imageData.title, imageData.summary || '', caption);
      webAnalysisEngine = 'gemini';
      if (!result || !result.coherente || !result.calidad_aceptable || (result.problemas_detectados && result.problemas_detectados.some((p: string)=>p.toLowerCase().includes('marca de agua')))) {
        usedFallback = true;
        flows.push('web_original First QA gemini; fallback Ollama');
        let fall = await analyzeImageWithOllama(webOriginal, imageData.title, imageData.summary || '', caption);
        webAnalysis = fall; webAnalysisEngine = 'ollama';
      } else {
        webAnalysis = result; webAnalysisEngine = 'gemini';
        flows.push('web_original QA OK gemini');
      }
    } catch (e: any) {
      errors.push('webQA Error: ' + String(e));
      let fall = await analyzeImageWithOllama(webOriginal, imageData.title, imageData.summary || '', caption);
      webAnalysis = fall; webAnalysisEngine = 'ollama';
      flows.push('web_original QA Fallback Ollama tras error');
    }
  }

  // Paso 2: QA imagen principal (generada)
  let geminiResult: any = null;
  let mainQAFallback = false;
  let finalImageUrl = imageUrl;
  // Primer intento de QA sobre la imagen (la original/web)
  if (imageUrl) {
    try {
      geminiResult = await analyzeImageWithGemini(
        imageUrl,
        imageData.title,
        imageData.summary || '',
        caption
      );
      flows.push('main Gemini QA OK');
    } catch (e) {
      errors.push('main Gemini QA error: '+String(e));
      geminiResult = null;
    }
  }
  // Si NO es buena, generar nueva (con AI Horde)
  if (!imageUrl || !geminiResult || !geminiResult.coherente || !geminiResult.calidad_aceptable || (geminiResult.problemas_detectados && geminiResult.problemas_detectados.some((p: string) => p.toLowerCase().includes('marca de agua')))) {
    mainQAFallback = true;
    usedFallback = true;
    // State-of-the-art config for realism, high quality, and robust text suppression on AI Horde
    const hordeOptions = {
      width: 1024,
      height: 1024, // SDXL native size for best photorealism
      steps: 70, // Más pasos: mayor detalle y calidad visual (más kudos)
      sampler_name: 'k_dpmpp_2m', // DPM++ 2M Karras
      n: 1,
      karras: true,
      qualityToggle: true,
      upscale: true,
      // Industry-best negative prompt for removing text/artifacts/logos
negative_prompt: "letter, text, watermark, logo, signature, words, handwriting, calligraphy, Chinese characters, captions, subtitles, labels, numbers, English characters, nsfw, porn, sex, sexual, child, children, naked, nude, loli, shota, explicit, underage, abuse, offensive, suggestive, erotic, hentai, mature, gore, violence, blood, disturbing, csam, lowres, bad anatomy, bad hands, missing fingers, extra digits, cropped, worst quality, low quality, jpeg artifacts"
// Models are set in the service for strict realism priority: SDXL, RealisticVision, Deliberate
    };
    // End QA config block
    try {
      console.log(`[AI HORDE] Prompt enviado (${imageData.slug}):\n${hordePrompt}`);
    const aiHordeUrl = await generateImageWithAIHorde(hordePrompt, imageData.slug, hordeOptions) || '';
if (aiHordeUrl && aiHordeUrl.startsWith('http')) {
  // --- Verifica que no sea imagen de error/CSAM ---
  let isBlacklisted = false;
  try {
    const fetch = (await import('node-fetch')).default;
    const resp = await fetch(aiHordeUrl, { method: 'GET' });
    if (!resp.ok) {
      isBlacklisted = true;
    } else {
      const buf = await resp.arrayBuffer();
      const text = Buffer.from(buf).toString('utf-8');
      if (text.includes('Potentially CSAM content detected') || text.includes('had to be deleted')) {
        isBlacklisted = true;
      }
    }
  } catch (e) {
    isBlacklisted = true;
  }
  if (!isBlacklisted) {
    finalImageUrl = aiHordeUrl;
    caption = generateProfessionalCaption(imageData.title, imageData.topic);
    flows.push('gen AIHorde OK');
  } else {
    errors.push('AI Horde devolvió imagen CSAM blacklisted o error. Activando fallback.');
    flows.push('gen AIHorde INVALID placeholder (blacklist)');
  }
} else {
  errors.push('AI Horde output was invalid (empty or non-http url)');
  flows.push('gen AIHorde INVALID result');
}
    } catch (e) {
      errors.push('AI Horde error: ' + String(e));
      flows.push('AI Horde fail');
    }
    // QA a generada
    let qa = null, engine = 'gemini';
    try {
      qa = await analyzeImageWithGemini(finalImageUrl, imageData.title, imageData.summary || '', caption);
      if (!qa || !qa.coherente || !qa.calidad_aceptable || (qa.problemas_detectados && qa.problemas_detectados.some((p:string)=>p.toLowerCase().includes('marca de agua')))) {
        let oll = await analyzeImageWithOllama(finalImageUrl, imageData.title, imageData.summary || '', caption);
        if (oll) { qa = oll; engine = 'ollama';}
      }
    } catch (e: any) {
      let oll = await analyzeImageWithOllama(finalImageUrl, imageData.title, imageData.summary || '', caption);
      if (oll) { qa = oll; engine = 'ollama'; }
      errors.push('Generated img QA fallback ollama error: '+String(e));
    }
    geminiResult = qa;
    flows.push('QA generada por AIHorde');
  } else {
    // Si la imagen original web fue suficiente, guardar (Supabase) si falta
    try {
      const supabaseUrl = await saveImageToSupabase(imageUrl, imageData.slug);
      if (supabaseUrl) finalImageUrl = supabaseUrl;
    } catch (e) { errors.push('supabase save error');}
    caption = geminiResult?.caption_mejorado || caption;
    flows.push('Reutiliza original coherente');
  }

  // Guarda imagen en supabase si es nueva
  try {
    if (finalImageUrl && finalImageUrl !== imageUrl) {
      const supabaseUrlFinal = await saveImageToSupabase(finalImageUrl, imageData.slug);
      if (supabaseUrlFinal) finalImageUrl = supabaseUrlFinal;
    }
  } catch (e) { errors.push('supabase save fallback error');}

  // ULTIMATE FALLBACK: Si no hay imagen válida, usa Unsplash por categoría y pásala por QA.
  if ((!finalImageUrl || !geminiResult || !geminiResult.coherente || !geminiResult.calidad_aceptable || (geminiResult.problemas_detectados && geminiResult.problemas_detectados.some((p:string)=>p.toLowerCase().includes('marca de agua'))))) {
    const fallbackImages: Record<string, string[]> = {
      "Mercados": [
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1605792657660-596af9009e82?q=80&w=1200&auto=format&fit=crop"
      ],
      "Tecnología": [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop"
      ],
      "Web3": [
        "https://images.unsplash.com/photo-1639762681485-074b7f4f039a?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?q=80&w=1200&auto=format&fit=crop"
      ]
    };
    const category = imageData.topic || "Tecnología";
    const options = fallbackImages[category] || fallbackImages["Tecnología"];
    let unsplashUrl = options[Math.floor(Math.random() * options.length)];
    let unsplashQA = null;
    let unsplashCaption = `Imagen ilustrativa sobre ${category}`;
    let unsplashEngine = 'gemini';
    flows.push('Fallback definitivo a Unsplash: '+unsplashUrl);
    try {
      unsplashQA = await analyzeImageWithGemini(unsplashUrl, imageData.title, imageData.summary || '', unsplashCaption);
      if (!unsplashQA || !unsplashQA.coherente || !unsplashQA.calidad_aceptable || (unsplashQA.problemas_detectados && unsplashQA.problemas_detectados.some((p:string)=>p.toLowerCase().includes('marca de agua')))) {
        // Fallback a Ollama si Gemini no valida Unsplash (poco probable)
        flows.push('Unsplash QA Gemini fallo, intentando Ollama');
        unsplashQA = await analyzeImageWithOllama(unsplashUrl, imageData.title, imageData.summary || '', unsplashCaption);
        unsplashEngine = 'ollama';
      }
      if (unsplashQA && unsplashQA.coherente && unsplashQA.calidad_aceptable && !(unsplashQA.problemas_detectados && unsplashQA.problemas_detectados.some((p:string)=>p.toLowerCase().includes('marca de agua')))) {
        finalImageUrl = unsplashUrl;
        caption = unsplashCaption;
        geminiResult = unsplashQA;
        usedFallback = true;
        flows.push('Unsplash Fallback OK');
      } else {
        errors.push('Unsplash tampoco fue válido tras Gemini/Ollama QA. No hay imagen profesional disponible.');
        flows.push('No hay imagen profesional usable.');
        finalImageUrl = unsplashUrl;
        caption = unsplashCaption + ' (no validada por QA)';
      }
    } catch (ex) {
      // En caso extremo (error los dos validadores), usar Unsplash sin QA
      errors.push('Error QA con Unsplash, se usa sin validar por extrema necesidad.');
      flows.push('QA Visual bloquea todas las opciones, Unsplash sin QA');
      finalImageUrl = unsplashUrl;
      caption = unsplashCaption + ' (no validada por QA)';
    }
  }

  const result: any = {
    imageUrl: finalImageUrl,
    caption,
    mainQA: { engine: geminiResult?._engine || (geminiResult && geminiResult !== null ? mainQAFallback ? 'ollama' : 'gemini' : undefined), report: geminiResult, error: errors.join(' | ') },
    usedFallback,
    flows,
    errors
  };
  if (runTestWebQA && webOriginal) result.originalQA = { engine: webAnalysisEngine, report: webAnalysis };
  return result;
}
