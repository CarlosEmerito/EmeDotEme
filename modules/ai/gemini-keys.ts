/**
 * Gestión centralizada de API keys de Gemini.
 * Elimina la duplicación de carga/rotación entre gemini-text y gemini-vision.
 */

import 'dotenv/config';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_KEY_2 = process.env.GEMINI_API_KEY_2 || "";
const GEMINI_API_KEY_3 = process.env.GEMINI_API_KEY_3 || "";

/** Nombres legibles para logging */
export const KEY_NAMES = ['PRIMARIA', 'SECUNDARIA', 'TERCIARIA'] as const;

/** Devuelve las API keys disponibles (filtradas, no vacías) */
export function getGeminiApiKeys(): string[] {
  return [GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3].filter(k => !!k);
}

/** Devuelve el nombre legible de la key por índice */
export function getKeyName(index: number): string {
  return KEY_NAMES[index] || `EXTRA_${index + 1}`;
}

/** Comprueba si hay al menos una key configurada */
export function isGeminiAvailable(): boolean {
  return getGeminiApiKeys().length > 0;
}

// Log de disponibilidad (solo al cargar el módulo)
const keys = getGeminiApiKeys();
console.log(`🔑 Gemini API Keys disponibles: ${keys.length} (${KEY_NAMES.slice(0, keys.length).join(', ') || 'ninguna'})`);
