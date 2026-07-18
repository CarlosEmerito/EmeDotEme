import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiApiKeys, getKeyName } from './gemini-keys';
import { GEMINI_MODEL_NAME, IMAGE_ANALYSIS_SYSTEM_PROMPT } from './constants';
import { imageAnalysisResponseSchema } from './schemas';
import { logWithTime } from '../../lib/logger';

export interface ImageAnalysisResult {
  coherente: boolean;
  razon_coherencia: string;
  descripcion: string;
  calidad_aceptable: boolean;
  problemas_detectados: string[];
  caption_mejorado?: string;
}

/**
 * Analiza una imagen con Gemini Vision para determinar coherencia, calidad y watermarks.
 * Usa las 3 API keys con fallback entre ellas.
 * Si todas las keys fallan, lanza error (NO retorna placeholder).
 */
export async function analyzeImageWithGemini(
  imageUrl: string,
  articleTitle: string,
  articleSummary: string,
  currentCaption?: string
): Promise<ImageAnalysisResult> {
  const apiKeys = getGeminiApiKeys();

  if (apiKeys.length === 0) {
    logWithTime('⚠️ No hay API keys de Gemini Vision configuradas');
    throw new Error('No Gemini Vision API keys available');
  }

  const userPrompt = `Analiza esta imagen para el siguiente artículo:

Título: "${articleTitle}"
Resumen: "${articleSummary || 'No disponible'}"
Pie de foto actual: "${currentCaption || 'No disponible'}"

URL de la imagen: ${imageUrl}

Devuelve SOLO el JSON de análisis, nada más.`;

  // Descargar la imagen y convertirla a base64 para enviarla a Gemini (una sola vez)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let imagePart: any;
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'EmeDotEme/1.0 ImageAnalyzer',
        'Accept': 'image/*',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} al descargar imagen`);
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';

    imagePart = {
      inlineData: {
        data: base64,
        mimeType: mimeType,
      },
    };
  } catch (downloadErr) {
    logWithTime(`❌ Error descargando imagen para análisis: ${downloadErr}`);
    throw new Error(`No se pudo descargar la imagen: ${downloadErr}`);
  }

  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    const keyName = getKeyName(i);

    const retries = [30000, 60000, 120000]; // 30s, 60s, 120s
    let attempt = 0;

    while (true) {
      try {
        logWithTime(`🔍 Analizando imagen con Gemini Vision (${keyName})${attempt > 0 ? ` (reintento ${attempt}/3)` : ''}...`);

        const genAI = new GoogleGenerativeAI(apiKey);
        // systemInstruction separa las reglas de análisis de los datos variables
        // (título/resumen del artículo, que en última instancia también proceden
        // de una fuente externa vía el pipeline de generación de texto).
        const model = genAI.getGenerativeModel({
          model: GEMINI_MODEL_NAME,
          systemInstruction: IMAGE_ANALYSIS_SYSTEM_PROMPT,
        });

        const result = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [
              { text: userPrompt },
              imagePart,
            ],
          }],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.3,
            responseMimeType: 'application/json',
            responseSchema: imageAnalysisResponseSchema,
          },
        });

        const text = result.response.text();
        if (!text || text.trim().length === 0) {
          logWithTime(`❌ Gemini Vision (${keyName}) devolvió respuesta vacía`);
          break;
        }

        // Con responseSchema, Gemini ya no debería truncar/mal-formar el JSON,
        // pero mantenemos un intento de parseo defensivo por si acaso.
        let parsed: ImageAnalysisResult;
        try {
          parsed = JSON.parse(text) as ImageAnalysisResult;
          if (typeof parsed.coherente !== 'boolean' || typeof parsed.calidad_aceptable !== 'boolean') {
            throw new Error('Estructura JSON incompleta devuelta por Gemini');
          }
        } catch {
          logWithTime(`❌ JSON inválido/truncado de Gemini Vision: ${text.substring(0, 200)}...`);
          break; // Pasa a la siguiente clave API en vez de devolver datos inventados
        }

        logWithTime(`✅ Gemini (${GEMINI_MODEL_NAME}): ${JSON.stringify(parsed)}`);

        return parsed;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);

        // Detectar si es un error de sobrecarga / alta demanda (HTTP 503 / overloaded)
        const isOverloaded = errorMsg.includes('503') ||
                             errorMsg.toLowerCase().includes('overloaded') ||
                             errorMsg.toLowerCase().includes('service unavailable') ||
                             errorMsg.toLowerCase().includes('temporarily unavailable');

        if (isOverloaded && attempt < retries.length) {
          const waitTime = retries[attempt];
          logWithTime(`⚠️ Alta demanda/Sobrecarga en Gemini Vision (${keyName}). Reintentando en ${waitTime / 1000}s (intento ${attempt + 1}/${retries.length})...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          attempt++;
          continue;
        }

        if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('Quota')) {
          logWithTime(`⚠️ Cuota Gemini Vision ${keyName} excedida, intentando siguiente...`);
          break;
        } else if (errorMsg.includes('SAFETY')) {
          logWithTime(`❌ Contenido bloqueado por safety filters`);
          // Safety block = imagen probablemente problemática → rechazarla
          return {
            coherente: false,
            razon_coherencia: 'Imagen bloqueada por filtros de seguridad',
            descripcion: 'No se pudo analizar (bloqueada)',
            calidad_aceptable: false,
            problemas_detectados: ['Bloqueada por filtros de seguridad'],
          };
        } else {
          logWithTime(`❌ Error Gemini Vision ${keyName}: ${errorMsg}`);
          if (i === apiKeys.length - 1) {
            throw new Error(`Todas las keys de Gemini Vision fallaron: ${errorMsg}`);
          }
          break;
        }
      }
    }
  }

  throw new Error('Todas las API keys de Gemini Vision fueron agotadas');
}
