import { ImageAnalysisResult } from './gemini-vision.service';

const OLLAMA_VISION_MODEL = "llama3.2-vision:11b";
const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";

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

Debes responder ÚNICAMENTE con un objeto JSON con esta estructura exacta, sin markdown ni comillas escapadas:
{
  "coherente": true/false,
  "razon_coherencia": "explicación breve de por qué es coherente o no",
  "descripcion": "qué muestra la imagen en una frase",
  "calidad_aceptable": true/false,
  "problemas_detectados": ["lista de problemas si los hay"],
  "caption_mejorado": "un pie de foto profesional y humano (solo si es coherente)"
}`;

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

  console.log(`🔍 Analizando imagen con Ollama (${OLLAMA_VISION_MODEL})...`);

  try {
    // Descargar la imagen y convertirla a base64
    let base64Image: string;
    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'EmeDotEme/1.0 ImageAnalyzer',
          'Accept': 'image/*',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      base64Image = Buffer.from(buffer).toString('base64');
    } catch (downloadErr) {
      console.error(`❌ Error descargando imagen para Ollama: ${downloadErr}`);
      throw new Error(`No se pudo descargar la imagen: ${downloadErr}`);
    }

    // Petición a Ollama
    const payload = {
      model: OLLAMA_VISION_MODEL,
      prompt: `${ANALYSIS_SYSTEM_PROMPT}\n\n${userPrompt}`,
      images: [base64Image],
      stream: false,
      format: "json",
      options: {
        temperature: 0.2
      }
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
      throw new Error('Respuesta vacía de Ollama');
    }

    // Parsear JSON
    const cleaned = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error(`JSON inválido de Ollama: ${cleaned.substring(0, 200)}`);
    }

    const parsed = JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1)) as ImageAnalysisResult;

    if (typeof parsed.coherente !== 'boolean' || typeof parsed.calidad_aceptable !== 'boolean') {
      throw new Error('Estructura JSON incompleta devuelta por Ollama');
    }

    console.log(`✅ Ollama (${OLLAMA_VISION_MODEL}):`);
    console.log(JSON.stringify(parsed, null, 2));
    
    return parsed;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error Ollama Vision: ${errorMsg}`);
    throw new Error(`Ollama Vision falló: ${errorMsg}`);
  }
}
