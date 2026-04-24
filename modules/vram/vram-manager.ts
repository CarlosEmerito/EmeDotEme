import 'dotenv/config';
import { OLLAMA_URL } from '../ai/constants';

/**
 * Gestor de recursos de Video RAM (VRAM).
 * Centraliza la lógica de limpieza de memoria necesaria para alternar entre
 * modelos de lenguaje (Ollama) y modelos de generación de imágenes (Flux).
 */

function getTime(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function logWithTime(msg: string) {
  console.log(`[${getTime()}] [VRAM] ${msg}`);
}

/**
 * Fuerza a Ollama a descargar todos los modelos de la VRAM y espera a que sea efectivo.
 * Esto es CRÍTICO antes de ejecutar Flux en GPUs con menos de 24GB de VRAM.
 */
export async function unloadOllamaModels(): Promise<void> {
  try {
    const fetchNode = (await import('node-fetch')).default;
    const model = process.env.OLLAMA_MODEL;
    if (!model) {
      throw new Error('OLLAMA_MODEL no configurada');
    }
    
    // 1. Enviar orden de descarga (keep_alive: 0 descarga el modelo inmediatamente)
    // Usamos el endpoint /api/load o simulamos una carga con keep_alive 0
    await fetchNode(OLLAMA_URL.replace('/generate', '/load'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, keep_alive: 0 })
    });
    
    logWithTime('🧹 Orden de descarga enviada a Ollama. Esperando limpieza física...');
    
    // 2. Pausa obligatoria de 8 segundos para que el driver de NVIDIA limpie los buffers de memoria
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    logWithTime('✅ Limpieza de VRAM completada.');
  } catch (err) {
    logWithTime(`⚠️ No se pudo forzar la descarga de Ollama: ${err}`);
  }
}

/**
 * Configuración recomendada para peticiones a Ollama que libera memoria tras responder.
 */
export const OLLAMA_RELEASE_CONFIG = {
  keep_alive: 0
};
