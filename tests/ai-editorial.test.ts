import { test } from 'node:test';
import assert from 'node:assert';
import { clampSummary, sanitizeGlossary, sanitizeTags, sanitizeTickers } from '../modules/ai/ai.service.ts';
import { cadenaDeModelos } from '../modules/ai/constants.ts';
import { htmlToPlainText } from '../modules/news/news-sources.service.ts';

// Las cadenas de modelos no deben depender del entorno de quien ejecute los tests.
delete process.env.GEMINI_MODEL_QUALITY;
delete process.env.GEMINI_MODEL_LITE;

/**
 * Reglas editoriales que aplica el código (no el modelo): son deterministas y
 * por eso se pueden probar. Cubren los campos que el prompt pide pero que, si
 * el modelo se desvía, no deben llegar tal cual a la web.
 */

// ─── htmlToPlainText: del HTML de la fuente al texto que recibe el modelo ────

test('htmlToPlainText - quita scripts y estilos con su contenido', () => {
  const limpio = htmlToPlainText('<p>Antes</p><script>alert("x")</script><style>p{color:red}</style><p>Después</p>');
  assert.strictEqual(limpio.includes('alert'), false);
  assert.strictEqual(limpio.includes('color:red'), false);
  assert.strictEqual(limpio, 'Antes\nDespués');
});

test('htmlToPlainText - respeta los saltos de párrafo y decodifica entidades', () => {
  const limpio = htmlToPlainText('<p>Hola&nbsp;mundo &amp; adi&oacute;s</p><p>Segunda l&iacute;nea</p>');
  assert.strictEqual(limpio, 'Hola mundo & adiós\nSegunda línea');
});

test('htmlToPlainText - colapsa espacios y reduce los saltos de más a uno de párrafo', () => {
  const limpio = htmlToPlainText('<div>  A   B  </div>\n\n\n\n<div>  C  </div>');
  assert.strictEqual(limpio, 'A B\n\nC');
});

// ─── sanitizeTickers: solo símbolos admitidos, en mayúsculas y sin repetir ───

test('sanitizeTickers - deja solo los símbolos de la lista, en mayúsculas', () => {
  assert.deepStrictEqual(sanitizeTickers(['btc', 'eth']), ['BTC', 'ETH']);
});

test('sanitizeTickers - descarta empresas, pares y monedas fiduciarias', () => {
  assert.deepStrictEqual(sanitizeTickers(['MSFT', 'BTC-USD', 'USD', 'SOL']), ['SOL']);
});

test('sanitizeTickers - máximo 3 y sin repetidos', () => {
  assert.deepStrictEqual(sanitizeTickers(['BTC', 'BTC', 'ETH', 'SOL', 'XRP']), ['BTC', 'ETH', 'SOL']);
});

test('sanitizeTickers - sin tickers devuelve lista vacía', () => {
  assert.deepStrictEqual(sanitizeTickers([]), []);
});

// ─── sanitizeTags: minúsculas, sin repetir y con tope ────────────────────────

test('sanitizeTags - normaliza a minúsculas y elimina repetidos', () => {
  assert.deepStrictEqual(sanitizeTags(['Bitcoin', 'bitcoin', 'Regulación']), ['bitcoin', 'regulación']);
});

test('sanitizeTags - recorta a 5 etiquetas y descarta las de una letra', () => {
  assert.deepStrictEqual(sanitizeTags(['a', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis']), [
    'uno', 'dos', 'tres', 'cuatro', 'cinco',
  ]);
});

// ─── clampSummary: el resumen es la descripción que usa el buscador ──────────

test('clampSummary - deja intacto un resumen corto', () => {
  const corto = 'La NFL presenta un escrito ante el Tribunal Supremo.';
  assert.strictEqual(clampSummary(corto), corto);
});

test('clampSummary - corta en el último punto cuando cabe', () => {
  const largo = 'a'.repeat(150) + '. ' + 'b'.repeat(100);
  const recortado = clampSummary(largo);
  assert.strictEqual(recortado, 'a'.repeat(150) + '.');
  assert.ok(recortado.length <= 240);
});

test('clampSummary - sin un punto útil, corta por palabra y avisa con puntos suspensivos', () => {
  const largo = ('palabra '.repeat(50)).trim();
  const recortado = clampSummary(largo);
  assert.ok(recortado.length <= 241);
  assert.ok(recortado.endsWith('…'));
  assert.ok(!recortado.includes('palab…'));
});

// ─── sanitizeGlossary: solo términos que aparecen en el artículo ─────────────

test('sanitizeGlossary - conserva los términos que están en el texto', () => {
  const glosario = [
    { term: 'swaps', definition: 'Contratos de intercambio financiero.' },
    { term: 'amicus brief', definition: 'Escrito de un tercero ante un tribunal.' },
  ];
  const texto = 'La NFL sostiene que los swaps no son contratos deportivos.';
  assert.deepStrictEqual(sanitizeGlossary(glosario, texto), [
    { term: 'swaps', definition: 'Contratos de intercambio financiero.' },
  ]);
});

test('sanitizeGlossary - descarta términos que solo salían en enlaces relacionados', () => {
  const glosario = [{ term: 'Megamerger', definition: 'Fusión a gran escala.' }];
  assert.deepStrictEqual(sanitizeGlossary(glosario, 'La NFL presenta un escrito sobre Kalshi.'), []);
});

test('sanitizeGlossary - sin glosario devuelve lista vacía', () => {
  assert.deepStrictEqual(sanitizeGlossary(undefined, 'texto cualquiera'), []);
});

// ─── Cadenas de modelos: calidad para redactar, ligeros para el volumen ──────

test('cadenaDeModelos - la tarea de calidad empieza por el modelo bueno y tiene respaldo', () => {
  const cadena = cadenaDeModelos('quality');
  assert.strictEqual(cadena[0], 'gemini-3.8-flash');
  assert.ok(cadena.length >= 2, 'debe haber más de un modelo para cuando se agote la cuota');
});

test('cadenaDeModelos - la tarea de volumen usa solo modelos ligeros', () => {
  const cadena = cadenaDeModelos('lite');
  assert.strictEqual(cadena[0], 'gemini-3.1-flash-lite');
  assert.ok(cadena.every((modelo) => modelo.includes('lite')));
});

test('cadenaDeModelos - ninguna cadena repite modelos', () => {
  for (const tarea of ['quality', 'lite'] as const) {
    const cadena = cadenaDeModelos(tarea);
    assert.strictEqual(new Set(cadena).size, cadena.length);
  }
});
