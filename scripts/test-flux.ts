import { generateImageWithFlux, checkFluxStatus } from '../modules/ai/flux-image.service';

async function main() {
  console.log('🔍 Comprobando estado de Flux Local...');
  const available = await checkFluxStatus();
  
  if (!available) {
    console.warn('⚠️ El servidor de Flux Local no parece estar corriendo (http://127.0.0.1:8000).');
    console.log('Esto es normal si aún no has levantado el contenedor Docker.');
  } else {
    console.log('✅ Servidor Flux Local detectado.');
    
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
