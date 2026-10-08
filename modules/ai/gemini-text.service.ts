import 'dotenv/config';
import { GoogleGenerativeAI, type Schema } from '@google/generative-ai';
import { getGeminiApiKeys, getKeyName } from './gemini-keys';
import { cadenaDeModelos, type GeminiTaskKind } from './constants';
import { logWithTime } from '../../lib/logger';

interface GenerationOptions {
    systemPrompt: string;
    userPrompt: string;
    maxTokens?: number;
    temperature?: number;
    /** Fuerza la forma exacta del JSON de salida (evita tener que "recuperar" respuestas mal formadas). */
    responseSchema?: Schema;
    /** Tarea: elige la cadena de modelos (calidad para redactar, lite para volumen). */
    task?: GeminiTaskKind;
}

export async function generateTextWithGemini(
    options: GenerationOptions
): Promise<string | null> {
    const {
        systemPrompt,
        userPrompt,
        maxTokens = 6000,
        temperature = 0.7,
        responseSchema,
        task = 'quality',
    } = options;
    const apiKeys = getGeminiApiKeys();
    if (apiKeys.length === 0) {
        logWithTime('⚠️ Ninguna API key de Gemini configurada');
        return null;
    }

    const modelos = cadenaDeModelos(task);

    // Plazo máximo para toda la llamada (sumando claves, modelos y reintentos):
    // los modelos con razonamiento pueden tardar minutos y, con 3 claves × 3
    // modelos, sin este tope un mal día convertiría una llamada en media hora.
    const inicio = Date.now();
    const plazoMs = Number(process.env.GEMINI_PLAZO_MS ?? 300000);

    // Orden de los intentos: todas las claves con el mejor modelo y, si ninguna
    // tiene cuota, el siguiente modelo de la cadena. Merece la pena porque el
    // límite diario del plan gratuito es por modelo Y por proyecto: cambiar de
    // modelo estrena cuota aunque la clave sea la misma.
    for (const modelo of modelos) {
    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[i];
        const keyName = getKeyName(i);

        // Un solo reintento por sobrecarga: si Gemini está saturado, las otras
        // claves y modelos son una vía mejor que esperar tres minutos.
        const retries = [30000]; // 30s
        let attempt = 0;

        while (true) {
            if (Date.now() - inicio > plazoMs) {
                logWithTime(`⏱️ Plazo de ${Math.round(plazoMs / 1000)}s agotado esperando a Gemini (${modelo}): se abandona la llamada.`);
                return null;
            }
            try {
                logWithTime(`🔄 Generando con Gemini (${keyName}, modelo: ${modelo})${attempt > 0 ? ` (reintento ${attempt}/3)` : ''}...`);
                const genAI = new GoogleGenerativeAI(apiKey);
                // systemInstruction separa las INSTRUCCIONES (rol del periodista, reglas de
                // estilo) de los DATOS del usuario (noticias externas no confiables). Antes
                // ambas cosas se concatenaban en un único bloque "user", lo que facilitaba
                // que texto malicioso embebido en una fuente RSS se confundiera con una
                // instrucción real (prompt injection).
                const model = genAI.getGenerativeModel({
                    model: modelo,
                    systemInstruction: systemPrompt,
                });
                const generationConfig = {
                    maxOutputTokens: maxTokens,
                    temperature: temperature,
                    responseMimeType: "application/json" as const,
                    ...(responseSchema ? { responseSchema } : {}),
                };
                logWithTime('📤 Enviando prompt a Gemini...');
                const result = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                    generationConfig
                });
                const response = result.response;
                const text = response.text();
                if (!text || text.trim().length === 0) {
                    logWithTime(`❌ Gemini devolvió respuesta vacía (${keyName}, ${modelo})`);
                    break;
                }
                logWithTime(`✅ Texto generado con Gemini (${modelo}): ${text.substring(0, 100)}...`);
                return text;
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);

                // Detectar si es un error de sobrecarga / alta demanda (HTTP 503 / overloaded)
                const isOverloaded = errorMsg.includes('503') ||
                                     errorMsg.toLowerCase().includes('overloaded') ||
                                     errorMsg.toLowerCase().includes('service unavailable') ||
                                     errorMsg.toLowerCase().includes('temporarily unavailable');

                if (isOverloaded && attempt < retries.length) {
                    const waitTime = retries[attempt];
                    logWithTime(`⚠️ Alta demanda/Sobrecarga en Gemini (${keyName}). Reintentando en ${waitTime / 1000}s (intento ${attempt + 1}/${retries.length})...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    attempt++;
                    continue; // Reintenta en la misma clave API
                }

                if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('Quota')) {
                    logWithTime(`⚠️ Cuota agotada en ${keyName.toLowerCase()} (${modelo}), probando otra combinación...`);
                    break; // Siguiente clave y, si se agotan, siguiente modelo
                } else if (errorMsg.includes('400') && errorMsg.includes(' SAFETY')) {
                    logWithTime('❌ Contenido bloqueado por safety filters');
                    return null;
                } else {
                    logWithTime(`❌ Error con Gemini ${keyName.toLowerCase()} (${modelo}): ${errorMsg}`);
                    break; // Pasa a la siguiente clave API
                }
            }
        }
    }
    }

    logWithTime(`❌ Sin respuesta ni cuota en ninguna combinación (${modelos.join(', ')} × ${apiKeys.length} claves)`);
    return null;
}
