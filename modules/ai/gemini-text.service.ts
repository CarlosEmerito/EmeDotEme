import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_KEY_2 = process.env.GEMINI_API_KEY_2 || "";
const GEMINI_API_KEY_3 = process.env.GEMINI_API_KEY_3 || "";
const TEXT_MODEL = "gemini-2.5-flash";

console.log(`🔑 Gemini API Key principal: ${GEMINI_API_KEY ? 'SI' : 'NO'}`);
console.log(`🔑 Gemini API Key secundaria: ${GEMINI_API_KEY_2 ? 'SI' : 'NO'}`);
console.log(`🔑 Gemini API Key terciaria: ${GEMINI_API_KEY_3 ? 'SI' : 'NO'}`);

interface GenerationOptions {
    systemPrompt: string;
    userPrompt: string;
    maxTokens?: number;
    temperature?: number;
}

export function isGeminiAvailable(): boolean {
    return !!GEMINI_API_KEY || !!GEMINI_API_KEY_2 || !!GEMINI_API_KEY_3;
}

export async function generateTextWithGemini(
    options: GenerationOptions
): Promise<string | null> {
    const { systemPrompt, userPrompt, maxTokens = 6000, temperature = 0.7 } = options;
    const apiKeys = [GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3].filter(k => !!k);
    if (apiKeys.length === 0) {
        console.log('⚠️ Ninguna API key de Gemini configurada');
        return null;
    }
    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[i];
        const isPrimary = i === 0;
        const keyNames = ['PRIMARIA', 'SECUNDARIA', 'TERCIARIA'];
        const keyName = keyNames[i] || `EXTRA_${i+1}`;
        try {
            console.log(`🔄 Generando con Gemini (${keyName}, modelo: ${TEXT_MODEL})...`);
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: TEXT_MODEL });
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
                continue;
            }
            console.log(`✅ Texto generado con Gemini: ${text.substring(0, 100)}...`);
            return text;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('Quota')) {
                console.error(`⚠️ Cuota de Gemini ${keyName.toLowerCase()} excedida, intentando siguiente...`);
                continue;
            } else if (errorMsg.includes('400') && errorMsg.includes(' SAFETY')) {
                console.error('❌ Contenido bloqueado por safety filters');
                return null;
            } else {
                console.error(`❌ Error con Gemini ${keyName.toLowerCase()}: ${errorMsg}`);
                if (i === apiKeys.length - 1) {
                    return null;
                }
                continue;
            }
        }
    }
    return null;
}
