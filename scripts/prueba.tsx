/**
 * Script de prueba para funciones de IA de ai.service (solo Ollama)
 * Uso: npx tsx scripts/prueba.tsx [funcion]
 * 
 * Funciones disponibles:
 *   ollama      - Probar generación con Ollama
 *   postprocess - Probar post-procesado ortográfico
 *   all         - Probar todas las funciones (solo Ollama)
 */

import 'dotenv/config';
import { generateTextWithOllama, postprocessWithOllama } from '../modules/ai/ai.service';

const testArticle = {
  title: 'Bitcoin Supera los $100,000',
  summary: 'Bitcoin alcanza un nuevo máximo histórico.',
  content: `<p>Bitcoin ha alcanzado un nuevo máximo histórico al superar los $100,000.</p>
<p>Este hito marca un momento significativo para las criptomonedas.</p>`
};

const timings: Record<string, number> = {};

async function testOllama() {
  const start = Date.now();
  console.log('\n🧪 PROBANDO: generateTextWithOllama');
  console.log('==================================');
  
  const systemPrompt = 'Eres un asistente útil que responde en español.';
  const userPrompt = 'Explain what Bitcoin is in 2 sentences.';
  
  const result = await generateTextWithOllama({ systemPrompt, userPrompt });
  
  const elapsed = Date.now() - start;
  timings.ollama = elapsed;
  
  if (result) {
    console.log('✅ Resultado:', result.substring(0, 200), '...');
  } else {
    console.log('❌ Falló generateTextWithOllama');
  }
  console.log(`⏱️ Tiempo: ${(elapsed / 1000).toFixed(2)}s`);
}

async function testPostprocess() {
  const start = Date.now();
  console.log('\n🧪 PROBANDO: postprocessWithOllama');
  console.log('===============================');
  
  const result = await postprocessWithOllama(testArticle);
  
  const elapsed = Date.now() - start;
  timings.postprocess = elapsed;
  
  if (result && result !== testArticle) {
    console.log('✅ Resultado post-procesado:');
    console.log('  Título:', result.title?.substring(0, 50), '...');
    console.log('  Contenido:', result.content?.substring(0, 100), '...');
  } else {
    console.log('❌ Falló postprocessWithOllama o no hubo cambios');
  }
  console.log(`⏱️ Tiempo: ${(elapsed / 1000).toFixed(2)}s`);
}

async function testAll() {
  const totalStart = Date.now();
  console.log('🚀 PROBANDO FUNCIONES OLLAMA');
  console.log('========================\n');
  
  await testOllama();
  await testPostprocess();
  
  const totalElapsed = Date.now() - totalStart;
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE TIEMPOS');
  console.log('='.repeat(50));
  
  let totalTests = 0;
  for (const [test, time] of Object.entries(timings)) {
    const testName = test === 'ollama' ? 'generateTextWithOllama' : 'postprocessWithOllama';
    console.log(`  ${testName}: ${(time / 1000).toFixed(2)}s`);
    totalTests += time;
  }
  
  console.log('='.repeat(50));
  console.log(`  TOTAL: ${(totalTests / 1000).toFixed(2)}s`);
  console.log(`  ⏱️ Total real: ${(totalElapsed / 1000).toFixed(2)}s`);
  console.log('='.repeat(50));
  
  console.log('\n✅ Todas las pruebas completadas');
}

async function main() {
  const args = process.argv.slice(2);
  const test = args[0] || 'all';
  
  console.log('🧪 Script de Prueba - EmeDotEme AI (Ollama)');
  console.log('==========================================');
  console.log('📋 Test seleccionado:', test);
  
  switch (test) {
    case 'ollama':
      await testOllama();
      break;
    case 'postprocess':
      await testPostprocess();
      break;
    case 'all':
    default:
      await testAll();
  }
  
  console.log('\n👋 Prueba finalizada');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});