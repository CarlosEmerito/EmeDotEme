import 'dotenv/config';

// Script para diagnosticar errores de parseo JSON en respuestas de Gemini

interface TestCase {
  name: string;
  json: string;
  description: string;
}

const testCases: TestCase[] = [
  {
    name: "JSON válido completo",
    json: `{
  "title": "Título de ejemplo",
  "summary": "Resumen de ejemplo",
  "content": "<p>Contenido de ejemplo</p>",
  "imagePrompt": "cryptocurrency, blockchain",
  "tags": ["Bitcoin", "Blockchain"]
}`,
    description: "JSON perfectamente formado"
  },
  {
    name: "JSON truncado (falta cierre)",
    json: `{
  "title": "Título truncado",
  "summary": "Resumen truncado",
  "content": "<p>Contenido incompleto`,
    description: "JSON sin cierre, simula respuesta truncada"
  },
  {
    name: "JSON con code blocks",
    json: "```json\n{\n  \"title\": \"Título con code block\",\n  \"summary\": \"Resumen\"\n}\n```",
    description: "JSON envuelto en code blocks"
  },
  {
    name: "JSON incompleto (sin tags)",
    json: `{
  "title": "Sin tags",
  "summary": "Resumen",
  "content": "<p>Contenido</p>",
  "imagePrompt": "prompt"
}`,
    description: "JSON sin campo tags"
  },
  {
    name: "JSON con error de sintaxis",
    json: `{
  "title": "Título con error",
  "summary": "Resumen",
  "content": "<p>Contenido</p>",
  "imagePrompt": "prompt",
  "tags": ["Bitcoin", "Blockchain",
}`,
    description: "JSON con coma extra al final"
  },
  {
    name: "Respuesta muy corta (posible error)",
    json: `{ "title": "Corto" }`,
    description: "Respuesta mínima, faltan campos"
  },
  {
    name: "JSON con HTML problemático",
    json: `{
  "title": "Título",
  "summary": "Resumen",
  "content": "<p>Contenido con \"comillas\" y \\\\ escapes</p>",
  "imagePrompt": "prompt",
  "tags": ["Bitcoin"]
}`,
    description: "JSON con caracteres especiales en HTML"
  }
];

function simulateParse(json: string, testName: string) {
  console.log(`\n🔍 Test: ${testName}`);
  console.log(`📄 Input (${json.length} chars): ${json.substring(0, 100)}${json.length > 100 ? '...' : ''}`);
  
  try {
    // Simular el cleaning del módulo real
    const cleaned = json.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    console.log(`🧹 Cleaned: ${cleaned.substring(0, 100)}${cleaned.length > 100 ? '...' : ''}`);
    
    // Buscar JSON
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      console.log(`❌ Estructura JSON inválida. Start: ${jsonStart}, End: ${jsonEnd}`);
      console.log(`❌ Fragmento: ${cleaned.substring(Math.max(0, jsonStart - 50), Math.min(cleaned.length, (jsonEnd > 0 ? jsonEnd + 50 : 200)))}`);
      throw new Error('JSON incompleto o mal formado');
    }
    
    const jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
    console.log(`🔍 JSON extraído: ${jsonStr.substring(0, 150)}...`);
    
    const parsed = JSON.parse(jsonStr);
    console.log(`✅ JSON parseado correctamente`);
    console.log(`   Title: "${parsed.title}"`);
    console.log(`   Has tags: ${Array.isArray(parsed.tags) ? `Sí (${parsed.tags.length})` : 'No'}`);
    console.log(`   Has content: ${!!parsed.content}`);
    
    // Validación adicional
    if (!parsed.title || typeof parsed.title !== 'string') {
      console.warn(`⚠️ Campo 'title' inválido: ${JSON.stringify(parsed.title)}`);
    }
    if (!parsed.content || typeof parsed.content !== 'string') {
      console.warn(`⚠️ Campo 'content' ausente o inválido`);
    }
    
    return parsed;
  } catch (error: any) {
    console.error(`❌ Error parseando: ${error.message}`);
    
    // Intentar recuperación parcial
    try {
      const jsonMatch = json.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const partialJson = jsonMatch[0];
        console.log(`🔄 Intentando recuperar JSON parcial: ${partialJson.substring(0, 100)}...`);
        const partial = JSON.parse(partialJson);
        console.log(`🔄 Recuperado: "${partial.title || 'Sin título'}"`);
      }
    } catch (recoveryError) {
      console.error(`❌ Falló recuperación parcial: ${recoveryError}`);
    }
    
    return null;
  }
}

async function main() {
  console.log("🧪 DIAGNÓSTICO DE PARSEO JSON");
  console.log("=============================");
  
  for (const testCase of testCases) {
    simulateParse(testCase.json, `${testCase.name} - ${testCase.description}`);
  }
  
  // También probar con una respuesta real simulando truncamiento
  console.log("\n\n🎯 PRUEBA DE TRUNCAMIENTO REALISTA");
  console.log("=================================");
  
  const longJson = `{
  "title": "El Banco Central Europeo Acelera Preparativos para el Euro Digital, Enfocado en Privacidad y Seguridad",
  "summary": "El Banco Central Europeo (BCE) ha intensificado sus esfuerzos para desarrollar un euro digital, con un enfoque particular en garantizar la privacidad de los usuarios y la seguridad de las transacciones, mientras explora el potencial de la tecnología blockchain para las finanzas del futuro.",
  "content": "<p>En un movimiento que subraya el creciente interés de las instituciones financieras tradicionales en las tecnologías digitales, el Banco Central Europeo (BCE) ha anunciado avances significativos en el desarrollo de un euro digital. Este proyecto, que lleva años en discusión, busca ofrecer una alternativa digital al efectivo físico, adaptándose a la creciente digitalización de la economía.</p><h2>Un Enfoque Equilibrado: Innovación y Regulación</h2><p>Según fuentes del BCE, el diseño del euro digital está siendo cuidadosamente elaborado para equilibrar la innovación con consideraciones regulatorias y de privacidad. A diferencia de algunas criptomonedas, que ofrecen anonimato completo, el euro digital probablemente implementará mecanismos que permitan cierto grado de trazabilidad para prevenir actividades ilícitas, mientras protege la privacidad de las transacciones cotidianas de los ciudadanos.</p><p>\"No se trata solo de crear una versión digital del euro\", explicó un portavoz del BCE. \"Se trata de diseñar un instrumento que sea seguro, eficiente y que respete los valores fundamentales de la Unión Europea, incluida la protección de datos personales\".</p>`;
  
  // Simular truncamiento cortando el JSON
  const truncatedJson = longJson.substring(0, 500); // Cortar antes del cierre
  simulateParse(truncatedJson, "Truncamiento real (500 chars)");
  
  console.log("\n✅ Diagnóstico completado");
}

main().catch(console.error);