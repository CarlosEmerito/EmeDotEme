import 'dotenv/config';
import { GoogleGenerativeAI, type Schema } from '@google/generative-ai';
import { getGeminiApiKeys, getKeyName } from './gemini-keys';
import { GEMINI_MODEL_NAME } from './constants';
import { logWithTime } from '../../lib/logger';

interface GenerationOptions {
    systemPrompt: string;
    userPrompt: string;
    maxTokens?: number;
    temperature?: number;
    /** Fuerza la forma exacta del JSON de salida (evita tener que "recuperar" respuestas mal formadas). */
    responseSchema?: Schema;
}

export async function generateTextWithGemini(
    options: GenerationOptions
): Promise<string | null> {
    const { systemPrompt, userPrompt, maxTokens = 6000, temperature = 0.7, responseSchema } = options;
    const apiKeys = getGeminiApiKeys();
    if (apiKeys.length === 0) {
        logWithTime('⚠️ Ninguna API key de Gemini configurada');
        return null;
    }
    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[i];
        const keyName = getKeyName(i);

        const retries = [30000, 60000, 120000]; // 30s, 60s, 120s
        let attempt = 0;

        while (true) {
            try {
                logWithTime(`🔄 Generando con Gemini (${keyName}, modelo: ${GEMINI_MODEL_NAME})${attempt > 0 ? ` (reintento ${attempt}/3)` : ''}...`);
                const genAI = new GoogleGenerativeAI(apiKey);
                // systemInstruction separa las INSTRUCCIONES (rol del periodista, reglas de
                // estilo) de los DATOS del usuario (noticias externas no confiables). Antes
                // ambas cosas se concatenaban en un único bloque "user", lo que facilitaba
                // que texto malicioso embebido en una fuente RSS se confundiera con una
                // instrucción real (prompt injection).
                const model = genAI.getGenerativeModel({
                    model: GEMINI_MODEL_NAME,
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
                    logWithTime('❌ Gemini devolvió respuesta vacía');
                    break;
                }
                logWithTime(`✅ Texto generado con Gemini: ${text.substring(0, 100)}...`);
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
                    logWithTime(`⚠️ Cuota de Gemini ${keyName.toLowerCase()} excedida, intentando siguiente...`);
                    break; // Pasa a la siguiente clave API
                } else if (errorMsg.includes('400') && errorMsg.includes(' SAFETY')) {
                    logWithTime('❌ Contenido bloqueado por safety filters');
                    return null;
                } else {
                    logWithTime(`❌ Error con Gemini ${keyName.toLowerCase()}: ${errorMsg}`);
                    break; // Pasa a la siguiente clave API
                }
            }
        }
    }
    return null;
}
