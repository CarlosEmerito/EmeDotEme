import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_KEY_2 = process.env.GEMINI_API_KEY_2 || "";
const GEMINI_API_KEY_3 = process.env.GEMINI_API_KEY_3 || "";
const VISION_MODEL = "gemini-2.5-flash";

console.log(`🔑 Gemini Vision API Keys: ${GEMINI_API_KEY ? 'P' : ''}${GEMINI_API_KEY_2 ? 'S' : ''}${GEMINI_API_KEY_3 ? 'T' : ''} disponibles`);

interface ImageAnalysisResult {
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
- Solo es incoherent si la imagen no tiene relación alguna con el tema del artículo

Debes responder ÚNICAMENTE con un objeto JSON con esta estructura exacta:
{
  "coherente": true/false,
  "razon_coherencia": "explicación breve de por qué es coherente o no",
  "descripcion": "qué muestra la imagen en una frase",
  "calidad_aceptable": true/false,
  "problemas_detectados": ["lista de problemas si los hay"],
  "caption_mejorado": "un pie de foto profesional y humano (solo si es coherente)"
}`;

export async function analyzeImageWithGemini(
  imageUrl: string,
  articleTitle: string,
  articleSummary: string,
  currentCaption?: string
): Promise<ImageAnalysisResult> {
  // Implementación mínima temporal para evitar error de compilación
  return {
    coherente: true,
    razon_coherencia: 'Implementación placeholder',
    descripcion: 'Descripción de ejemplo',
    calidad_aceptable: true,
    problemas_detectados: [],
    caption_mejorado: currentCaption || 'Pie de foto generado por IA'
  };
}
