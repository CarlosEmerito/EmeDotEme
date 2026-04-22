/**
 * Script de prueba para funciones de IA de ai.service
 * Uso: npx tsx scripts/prueba.tsx [funcion]
 * 
 * Funciones disponibles:
 *   ollama      - Probar generación con Ollama
 *   postprocess - Probar post-procesado ortográfico
 *   en          - Probar generación inglés
 *   all         - Probar todas las funciones
 */

import 'dotenv/config';
import { generateTextWithOllama, postprocessWithOllama } from '../modules/ai/ai.service';

const testArticle = {
  title: 'Bitcoin Supera los $100,000 por Primera Vez en la Historia',
  summary: 'La criptomoneda líder alcanza un nuevo máximo histórico tras la aprobación de ETFs de Bitcoin en Estados Unidos.',
  content: `<p>Bitcoin ha alcanzado un precio sin precedentes, superando los $100,000 por primera vez en su historia. Este hito histórico llega después de meses de speculation y la aprobación histórica de los fondos cotizados (ETFs) de Bitcoin por parte de la SEC.</p>

<h2>El Camino hacia los $100,000</h2>
<p>Durante años, los analistas han predicho que bitcoin alcanzaría esta barrera psicológica. La subida se ha accelerado desde principios de 2024, impulsada por la institucionalización de bitcoin a través de productos financieros regulados.</p>

<h2>Implicaciones para el Mercado</h2>
<p>Este nuevo máximo histórico no solo tiene implicaciones para los inversores individuales, sino que marca un punto de inflexión en la adopción mainstream de las criptomonedas.</p>`
};

const testNews = [{
  title: 'Bitcoin Reaches $100,000',
  description: 'Bitcoin hits new all-time high',
  link: 'https://example.com/bitcoin-100k',
  source: 'Test Source',
  sourceSlug: 'test-source',
  pubDate: new Date(),
  categories: ['Bitcoin', 'Crypto'],
  imageUrl: 'https://example.com/image.jpg'
}];

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

async function testEnglish() {
  const start = Date.now();
  console.log('\n🧪 PROBANDO: generateBilingualContent');
  console.log('===================================');
  
  const { generateBilingualContent } = await import('../modules/ai/ai.service');
  
  const result = await generateBilingualContent(['Recent test'], testNews);
  
  const elapsed = Date.now() - start;
  timings.english = elapsed;
  
  if (result) {
    console.log('✅ Resultado bilingüe:');
    console.log('  ES:', result.title?.substring(0, 50));
    console.log('  EN:', result.titleEn?.substring(0, 50));
  } else {
    console.log('❌ Falló generateBilingualContent');
  }
  console.log(`⏱️ Tiempo: ${(elapsed / 1000).toFixed(2)}s`);
}

async function testAll() {
  const totalStart = Date.now();
  console.log('🚀 PROBANDO TODAS LAS FUNCIONES');
  console.log('========================\n');
  
  await testOllama();
  await testPostprocess();
  await testEnglish();
  
  const totalElapsed = Date.now() - totalStart;
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE TIEMPOS');
  console.log('='.repeat(50));
  
  let totalTests = 0;
  for (const [test, time] of Object.entries(timings)) {
    const testName = test === 'ollama' ? 'generateTextWithOllama' 
                 : test === 'postprocess' ? 'postprocessWithOllama' 
                 : test === 'english' ? 'generateBilingualContent' : test;
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
  
  console.log('🧪 Script de Prueba - EmeDotEme AI');
  console.log('==============================');
  console.log('📋 Test seleccionado:', test);
  
  switch (test) {
    case 'ollama':
      await testOllama();
      break;
    case 'postprocess':
      await testPostprocess();
      break;
    case 'en':
    case 'english':
      await testEnglish();
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