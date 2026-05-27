import { ImageAnalysisResult } from './gemini-vision.service';
import { OLLAMA_URL, IMAGE_ANALYSIS_SYSTEM_PROMPT } from './constants';
import { unloadOllamaModels } from '../vram/vram-manager';

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
  const visionModel = process.env.OLLAMA_VISION_MODEL;
  if (!visionModel) {
    throw new Error('❌ Error: La variable de entorno OLLAMA_VISION_MODEL no está configurada.');
  }

  const userPrompt = `Analiza esta imagen para el siguiente artículo:

Título: "${articleTitle}"
Resumen: "${articleSummary || 'No disponible'}"
Pie de foto actual: "${currentCaption || 'No disponible'}"

Devuelve SOLO el JSON de análisis, nada más.`;

  logWithTime(`🔍 Analizando imagen con Ollama (${visionModel})...`);

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

      // Petición a Ollama con Streaming habilitado
      const payload = {
        model: visionModel,
        prompt: `${IMAGE_ANALYSIS_SYSTEM_PROMPT}\n\n${userPrompt}`,
        images: [base64Image],
        stream: true,
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

      process.stdout.write('🧠 [Pensando]: ');
      let text = "";
      const body = response.body;
      if (!body) throw new Error('No se pudo obtener el cuerpo de la respuesta de visión');

      const decoder = new TextDecoder();
      // @ts-expect-error - ReadableStream iterate support
      for await (const chunk of body) {
        const lines = decoder.decode(chunk, { stream: true }).split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            const thinking = data.thinking || "";
            const responsePart = data.response || "";
            
            if (thinking) {
              process.stdout.write(thinking);
            }
            
            text += responsePart || thinking;
            if (data.done) break;
          } catch {}
        }
      }
      console.log('\n[Fin del razonamiento]');

      if (!text || text.trim().length === 0) {
        throw new Error('Respuesta de Ollama Vision vacía');
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

      logWithTime(`✅ Ollama Vision completado (${visionModel}).`);
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
