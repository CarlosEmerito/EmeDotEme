import { ImageAnalysisResult } from './gemini-vision.service';
import { OLLAMA_VISION_MODEL, OLLAMA_URL, IMAGE_ANALYSIS_SYSTEM_PROMPT } from './constants';

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
      prompt: `${IMAGE_ANALYSIS_SYSTEM_PROMPT}\n\n${userPrompt}`,
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
