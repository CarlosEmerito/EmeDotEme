import { generateImageWithFlux, checkFluxStatus } from '../modules/ai/flux-image.service';
import { unloadOllamaModels } from '../modules/ai/ai.service';

async function main() {
  console.log('🔍 Comprobando estado de Flux Local...');
  const available = await checkFluxStatus();

  if (!available) {
    console.log('❌ El servidor Flux Local no responde en http://127.0.0.1:8000');
    console.log('Esto es normal si aún no has levantado el contenedor Docker.');
  } else {
    console.log('✅ Servidor Flux Local detectado.');

    // Limpiar VRAM para asegurar éxito en el test
    console.log('🧹 Limpiando VRAM de Ollama antes del test...');
    await unloadOllamaModels();
    console.log('⏱️ Esperando 5s...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🎨 Intentando generar una imagen de prueba...');
    const result = await generateImageWithFlux(
      'A futuristic city with flying cars, cyber punk style, high quality',
      'test-flux-article'
    );
    
    if (result) {
      console.log('✅ Imagen generada con éxito (Base64 recibida)');
      console.log(`Longitud del string: ${result.length} caracteres`);
    } else {
      console.error('❌ Error en la generación de imagen');
    }
  }
}

main().catch(console.error);
