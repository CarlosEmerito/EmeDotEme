import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiApiKeys, getKeyName } from './gemini-keys';
import { GEMINI_MODEL_NAME } from './constants';

interface GenerationOptions {
    systemPrompt: string;
    userPrompt: string;
    maxTokens?: number;
    temperature?: number;
}

export { isGeminiAvailable } from './gemini-keys';

export async function generateTextWithGemini(
    options: GenerationOptions
): Promise<string | null> {
    const { systemPrompt, userPrompt, maxTokens = 6000, temperature = 0.7 } = options;
    const apiKeys = getGeminiApiKeys();
    if (apiKeys.length === 0) {
        console.log('⚠️ Ninguna API key de Gemini configurada');
        return null;
    }
    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[i];
        const keyName = getKeyName(i);
        
        const retries = [30000, 60000, 120000]; // 30s, 60s, 120s
        let attempt = 0;
        
        while (true) {
            try {
                console.log(`🔄 Generando con Gemini (${keyName}, modelo: ${GEMINI_MODEL_NAME})${attempt > 0 ? ` (reintento ${attempt}/3)` : ''}...`);
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });
                const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
                const generationConfig = {
                    maxOutputTokens: maxTokens,
                    temperature: temperature,
                    responseMimeType: "application/json" as const
                };
                console.log('📤 Enviando prompt a Gemini...');
                const result = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
                    generationConfig
                });
                const response = result.response;
                const text = response.text();
                if (!text || text.trim().length === 0) {
                    console.error('❌ Gemini devolvió respuesta vacía');
                    break;
                }
                console.log(`✅ Texto generado con Gemini: ${text.substring(0, 100)}...`);
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
                    console.warn(`⚠️ Alta demanda/Sobrecarga en Gemini (${keyName}). Reintentando en ${waitTime / 1000}s (intento ${attempt + 1}/${retries.length})...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    attempt++;
                    continue; // Reintenta en la misma clave API
                }
                
                if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('Quota')) {
                    console.error(`⚠️ Cuota de Gemini ${keyName.toLowerCase()} excedida, intentando siguiente...`);
                    break; // Pasa a la siguiente clave API
                } else if (errorMsg.includes('400') && errorMsg.includes(' SAFETY')) {
                    console.error('❌ Contenido bloqueado por safety filters');
                    return null;
                } else {
                    console.error(`❌ Error con Gemini ${keyName.toLowerCase()}: ${errorMsg}`);
                    break; // Pasa a la siguiente clave API
                }
            }
        }
    }
    return null;
}
