import { ImageAnalysisResult } from './gemini-vision.service';
import { OLLAMA_VISION_MODEL, OLLAMA_URL, IMAGE_ANALYSIS_SYSTEM_PROMPT } from './constants';
import { unloadOllamaModels } from './ai.service';

function getTime(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function logWithTime(msg: string) {
  console.log(`[${getTime()}] ${msg}`);
}

export async function analyzeImageWithOllama(
  imageUrl: string,
  articleTitle: string,
  articleSummary: string,
  currentCaption?: string
): Promise<ImageAnalysisResult> {
  const userPrompt = `Analiza esta imagen para el siguiente artículo:

Título: "${articleTitle}"
Resumen: "${articleSummary || 'No disponible'}"
Pie de foto actual: "${currentCaption || 'No disponible'}"

Devuelve SOLO el JSON de análisis, nada más.`;

  logWithTime(`🔍 Analizando imagen con Ollama (${OLLAMA_VISION_MODEL})...`);

  // Descargar la imagen y convertirla a base64 (una sola vez)
  let base64Image: string;
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'EmeDotEme/1.0 ImageAnalyzer',
        'Accept': 'image/*',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    base64Image = Buffer.from(buffer).toString('base64');
  } catch (downloadErr) {
    logWithTime(`❌ Error descargando imagen para Ollama: ${downloadErr}`);
    throw new Error(`No se pudo descargar la imagen: ${downloadErr}`);
  }

  const maxRetries = 2;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      // Limpiar VRAM antes de cargar modelo de visión pesado (en reintentos)
      if (attempt > 0) {
        logWithTime(`🧹 Limpiando VRAM antes del reintento ${attempt}...`);
        await unloadOllamaModels();
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Petición a Ollama
      const payload = {
        model: OLLAMA_VISION_MODEL,
        prompt: `${IMAGE_ANALYSIS_SYSTEM_PROMPT}\n\n${userPrompt}`,
        images: [base64Image],
        stream: false,
        format: "json",
        options: {
          temperature: 0.2
        },
        keep_alive: 0
      };

      const response = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Ollama API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.response;

      if (!text || text.trim().length === 0) {
        throw new Error('Respuesta de Ollama vacía');
      }

      // Parsear JSON
      const cleaned = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error(`JSON inválido de Ollama: ${cleaned.substring(0, 200)}`);
      }

      const jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(jsonStr) as ImageAnalysisResult;

      if (typeof parsed.coherente !== 'boolean' || typeof parsed.calidad_aceptable !== 'boolean') {
        throw new Error('Estructura JSON incompleta devuelta por Ollama');
      }

      logWithTime(`✅ Ollama Vision completado (${OLLAMA_VISION_MODEL}).`);
      return parsed;

    } catch (error: any) {
      attempt++;
      if (attempt <= maxRetries) {
        const waitTime = 10000;
        logWithTime(`⚠️ Intento ${attempt} de visión fallido (${error.message}). Reintentando en ${waitTime/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        logWithTime(`❌ Todos los intentos de visión con Ollama han fallado.`);
        throw error;
      }
    }
  }
  throw new Error('Error inesperado en loop de visión');
}
