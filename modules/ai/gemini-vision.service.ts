import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_KEY_2 = process.env.GEMINI_API_KEY_2 || "";
const GEMINI_API_KEY_3 = process.env.GEMINI_API_KEY_3 || "";
const VISION_MODEL = "gemini-2.5-flash";

console.log(`🔑 Gemini Vision API Keys: ${GEMINI_API_KEY ? 'P' : ''}${GEMINI_API_KEY_2 ? 'S' : ''}${GEMINI_API_KEY_3 ? 'T' : ''} disponibles`);

export interface ImageAnalysisResult {
  coherente: boolean;
  razon_coherencia: string;
  descripcion: string;
  calidad_aceptable: boolean;
  problemas_detectados: string[];
  caption_mejorado?: string;
}

const ANALYSIS_SYSTEM_PROMPT = `Eres un analista de imágenes especializado en noticias de criptomonedas, blockchain y tecnología Web3.

Tu tarea es analizar una imagen y determinar:
1. QUÉ muestra la imagen (descripción objetiva)
2. SI es COHERENTE con el artículo periodístico (relación con el tema)
3. SI la calidad es ACEPTABLE para un portal de noticias profesional

IMPORTANTE sobre coherencia:
- Una imagen ES coherente si muestra la marca, logo, edificio, o representación visual de la empresa/persona mencionada en el artículo
- NO es necesario que aparezcan símbolos de Bitcoin, Ethereum, blockchain, etc. si el artículo trata sobre una empresa tradicional que está incursionando en crypto
- Por ejemplo: Si el artículo es sobre "Charles Schwab y Bitcoin" y la imagen muestra el edificio/oficina de Charles Schwab, ES COHERENTE aunque no muestre BTC
- Solo es incoherente si la imagen no tiene relación alguna con el tema del artículo

IMPORTANTE sobre calidad:
- Asume que la calidad_aceptable es TRUE por defecto. Las fotos periodísticas y de stock estándar SIEMPRE son aceptables.
- SÉ FLEXIBLE: Se permiten imágenes que contengan algo de texto incidental (como señales, pantallas, carteles en el fondo).
- RECHAZA SOLAMENTE basuras visuales claras: capturas de pantalla mal recortadas o imágenes extremadamente diminutas e ilegibles.
- Presta ESPECIAL ATENCIÓN a marcas de agua o logos SUPERPUESTOS de fuentes de noticias (ej: "Decrypt", "CoinDesk", "Cointelegraph", "The Block", "Bloomberg", "Reuters"). SOLO si son claramente marcas de agua (logos pegados encima de la foto), debes rechazarla (calidad_aceptable: false). No rechaces por texto natural de la foto.

Debes responder ÚNICAMENTE con un objeto JSON con esta estructura exacta:
{
  "coherente": true/false,
  "razon_coherencia": "explicación breve de por qué es coherente o no",
  "descripcion": "qué muestra la imagen en una frase",
  "calidad_aceptable": true/false,
  "problemas_detectados": ["lista de problemas si los hay (ej: 'marca de agua de decrypt detectada')"],
  "caption_mejorado": "un pie de foto profesional y humano (solo si es coherente)"
}`;

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
  const apiKeys = [GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3].filter(k => !!k);

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
    const keyNames = ['PRIMARIA', 'SECUNDARIA', 'TERCIARIA'];
    const keyName = keyNames[i] || `EXTRA_${i + 1}`;

    try {
      console.log(`🔍 Analizando imagen con Gemini Vision (${keyName})...`);

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: VISION_MODEL });

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
            { text: `${ANALYSIS_SYSTEM_PROMPT}\n\n${userPrompt}` },
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

      // Parsear JSON
      const cleaned = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        console.error(`❌ JSON inválido de Gemini Vision: ${cleaned.substring(0, 200)}`);
        continue;
      }

      const parsed = JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1)) as ImageAnalysisResult;

      // Validar estructura mínima
      if (typeof parsed.coherente !== 'boolean' || typeof parsed.calidad_aceptable !== 'boolean') {
        console.error(`❌ Estructura JSON incompleta de Gemini Vision`);
        continue;
      }

      console.log(`✅ Gemini Vision (${keyName}): coherente=${parsed.coherente}, calidad=${parsed.calidad_aceptable}, problemas=${parsed.problemas_detectados?.length || 0}`);
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
