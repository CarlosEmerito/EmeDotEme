import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiApiKeys, getKeyName } from './gemini-keys';
import { GEMINI_MODEL_NAME, IMAGE_ANALYSIS_SYSTEM_PROMPT } from './constants';

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
    console.warn('⚠️ No hay API keys de Gemini Vision configuradas');
    throw new Error('No Gemini Vision API keys available');
  }

  const userPrompt = `Analiza esta imagen para el siguiente artículo:

Título: "${articleTitle}"
Resumen: "${articleSummary || 'No disponible'}"
Pie de foto actual: "${currentCaption || 'No disponible'}"

URL de la imagen: ${imageUrl}

Devuelve SOLO el JSON de análisis, nada más.`;

  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    const keyName = getKeyName(i);

    try {
      console.log(`🔍 Analizando imagen con Gemini Vision (${keyName})...`);

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

      // Descargar la imagen y convertirla a base64 para enviarla a Gemini
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
        console.error(`❌ Error descargando imagen para análisis: ${downloadErr}`);
        throw new Error(`No se pudo descargar la imagen: ${downloadErr}`);
      }

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: `${IMAGE_ANALYSIS_SYSTEM_PROMPT}\n\n${userPrompt}` },
            imagePart,
          ],
        }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      });

      const text = result.response.text();
      if (!text || text.trim().length === 0) {
        console.error(`❌ Gemini Vision (${keyName}) devolvió respuesta vacía`);
        continue;
      }

      // Parsear JSON con reparación de emergencia para respuestas truncadas
      const cleaned = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      const jsonStart = cleaned.indexOf('{');
      
      if (jsonStart === -1) {
        console.error(`❌ Respuesta sin JSON de Gemini Vision (${keyName})`);
        continue;
      }

      let parsed: ImageAnalysisResult;
      
      try {
        const jsonEnd = cleaned.lastIndexOf('}');
        if (jsonEnd === -1) throw new Error('JSON truncado (no se encontró })');
        parsed = JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1)) as ImageAnalysisResult;
        
        if (typeof parsed.coherente !== 'boolean' || typeof parsed.calidad_aceptable !== 'boolean') {
          throw new Error('Estructura JSON incompleta devuelta por Gemini');
        }
      } catch (parseError) {
        console.error(`❌ JSON inválido/truncado de Gemini Vision: ${cleaned.substring(0, 200)}...`);
        console.log(`⚠️ Aplicando recuperación de emergencia (extrayendo variables directamente del string)`);
        
        const isCoherente = cleaned.includes('"coherente": true') || cleaned.includes('"coherente":true') || cleaned.includes('"coherente":  true');
        const isAcceptable = cleaned.includes('"calidad_aceptable": false') || cleaned.includes('"calidad_aceptable":false') ? false : true;
        
        parsed = {
          coherente: isCoherente,
          razon_coherencia: "Recuperación automática de JSON truncado",
          descripcion: "Descripción parcial recuperada mecánicamente.",
          calidad_aceptable: isAcceptable,
          problemas_detectados: []
        };
      }

      console.log(`✅ Gemini (${GEMINI_MODEL_NAME}):`);
      console.log(JSON.stringify(parsed, null, 2));
      
      return parsed;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('Quota')) {
        console.error(`⚠️ Cuota Gemini Vision ${keyName} excedida, intentando siguiente...`);
        continue;
      } else if (errorMsg.includes('SAFETY')) {
        console.error(`❌ Contenido bloqueado por safety filters`);
        // Safety block = imagen probablemente problemática → rechazarla
        return {
          coherente: false,
          razon_coherencia: 'Imagen bloqueada por filtros de seguridad',
          descripcion: 'No se pudo analizar (bloqueada)',
          calidad_aceptable: false,
          problemas_detectados: ['Bloqueada por filtros de seguridad'],
        };
      } else {
        console.error(`❌ Error Gemini Vision ${keyName}: ${errorMsg}`);
        if (i === apiKeys.length - 1) {
          throw new Error(`Todas las keys de Gemini Vision fallaron: ${errorMsg}`);
        }
        continue;
      }
    }
  }

  throw new Error('Todas las API keys de Gemini Vision fueron agotadas');
}
