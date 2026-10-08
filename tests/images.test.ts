import { test } from 'node:test';
import assert from 'node:assert';
import { buildStockQuery } from '../modules/images/stock-image.service.ts';
import { IMAGE_SOURCE_LABEL, generateCaption, pickFallbackImage, resolveCaption } from '../modules/images/image.service.ts';
import { isAllowedToStore } from '../modules/storage/supabase.service.ts';

/**
 * Estas pruebas cubren los dos guardarraíles legales del proyecto:
 * no re-alojar imágenes de terceros y no descargar imágenes de prensa.
 */

// ─── isAllowedToStore: el guardián del almacenamiento ────────────────────────

test('isAllowedToStore - permite los Data URI (imágenes generadas con IA)', () => {
  assert.strictEqual(isAllowedToStore('data:image/jpeg;base64,/9j/4AAQSkZJRg=='), true);
});

test('isAllowedToStore - permite las fuentes con licencia comercial', () => {
  assert.strictEqual(isAllowedToStore('https://cdn.pixabay.com/photo/2026/01/a.jpg'), true);
  assert.strictEqual(isAllowedToStore('https://images.pexels.com/photos/1/a.jpeg'), true);
  assert.strictEqual(isAllowedToStore('https://images.unsplash.com/photo-123'), true);
  assert.strictEqual(isAllowedToStore('https://www.emedoteme.es/logo.png'), true);
});

test('isAllowedToStore - permite el propio almacén de Supabase', () => {
  assert.strictEqual(
    isAllowedToStore('https://elfglqkqprwlenwjtfgj.supabase.co/storage/v1/object/public/article-images/a.jpg'),
    true
  );
});

test('isAllowedToStore - RECHAZA las imágenes de prensa de terceros', () => {
  // Estos son exactamente los medios de los que se alimenta el pipeline.
  const prensa = [
    'https://cdn.decrypt.co/resize/1024/foto.jpg',
    'https://www.bleepstatic.com/content/hl-images/2026/09/25/a.jpg',
    'https://techcrunch.com/wp-content/uploads/2026/10/foto.jpg',
    'https://www.tbstat.com/cdn-cgi/image/width=1600/foto.jpg',
    'https://blogger.googleusercontent.com/img/b/a.jpg',
    'https://securityaffairs.com/wp-content/uploads/2026/10/foto.jpg',
  ];
  for (const url of prensa) {
    assert.strictEqual(isAllowedToStore(url), false, `no debería permitir ${url}`);
  }
});

test('isAllowedToStore - RECHAZA URLs no parseables', () => {
  assert.strictEqual(isAllowedToStore('no-es-una-url'), false);
  assert.strictEqual(isAllowedToStore(''), false);
});

test('isAllowedToStore - no se deja engañar por un subdominio parecido', () => {
  // "pixabay.com.malicioso.net" no es Pixabay.
  assert.strictEqual(isAllowedToStore('https://pixabay.com.evil.net/foto.jpg'), false);
});

// ─── buildStockQuery ─────────────────────────────────────────────────────────

test('buildStockQuery - usa el tema como señal principal', () => {
  const q = buildStockQuery('El precio de Bitcoin se dispara', 'Criptomonedas');
  assert.ok(q.startsWith('criptomonedas'), `esperaba empezar por el tema, salió: "${q}"`);
});

test('buildStockQuery - quita signos y palabras vacías', () => {
  const q = buildStockQuery('¡Nuevo! Ataque de ransomware contra hospitales', 'Ciberseguridad');
  assert.ok(!q.includes('¡'), 'no debería conservar signos');
  assert.ok(!q.includes(' de '), 'no debería conservar palabras vacías');
});

test('buildStockQuery - se queda solo con el tema si el titular no aporta nada', () => {
  assert.strictEqual(buildStockQuery('', 'IA'), 'ia');
  assert.strictEqual(buildStockQuery('de la y el', 'IA'), 'ia');
});

// ─── pickFallbackImage ───────────────────────────────────────────────────────

test('pickFallbackImage - devuelve una imagen de la categoría pedida', () => {
  assert.ok(pickFallbackImage('Criptomonedas').startsWith('https://'));
});

test('pickFallbackImage - siempre devuelve algo, aunque la categoría no exista', () => {
  assert.ok(pickFallbackImage('CategoríaInexistente').startsWith('https://'));
  assert.ok(pickFallbackImage(undefined).startsWith('https://'));
});

test('pickFallbackImage - la reserva sale del propio proyecto, no de prensa ajena', () => {
  // Si esto falla, la cascada estaría metiendo una imagen de terceros por la puerta de atrás.
  assert.strictEqual(isAllowedToStore(pickFallbackImage('IA')), true);
});

test('pickFallbackImage - no repite una imagen que ya se ha usado', () => {
  const primera = pickFallbackImage('Criptomonedas');
  const segunda = pickFallbackImage('Criptomonedas', [primera]);
  assert.notStrictEqual(segunda, primera);
  assert.ok(segunda.startsWith('https://'));
});

test('pickFallbackImage - con todo el pool usado recicla la más antigua, no siempre la primera', () => {
  const usadas: string[] = [];
  for (let i = 0; i < 3; i++) {
    const siguiente = pickFallbackImage('Criptomonedas', usadas);
    assert.ok(!usadas.includes(siguiente), 'las tres primeras deben ser distintas entre sí');
    usadas.push(siguiente);
  }
  // `usadas` va de la más reciente a la más antigua: al agotarse el pool debe
  // devolver la última de la lista (la que hace más tiempo que no sale).
  assert.strictEqual(pickFallbackImage('Criptomonedas', usadas), usadas[usadas.length - 1]);
});

// ─── Pie de foto: describe la imagen, nunca su procedencia ───────────────────

test('resolveCaption - usa el pie redactado por el control de calidad', () => {
  assert.strictEqual(
    resolveCaption({ caption_mejorado: 'Un gráfico de velas sobre fondo oscuro.', descripcion: 'otra cosa' }, 'respaldo'),
    'Un gráfico de velas sobre fondo oscuro.'
  );
});

test('resolveCaption - sin pie mejorado cae a la descripción objetiva', () => {
  assert.strictEqual(
    resolveCaption({ descripcion: 'La imagen muestra un gráfico financiero.' }, 'respaldo'),
    'La imagen muestra un gráfico financiero.'
  );
});

test('resolveCaption - sin análisis usa el pie de respaldo', () => {
  assert.strictEqual(resolveCaption(null, 'Ilustración sobre Mercados.'), 'Ilustración sobre Mercados.');
  assert.strictEqual(resolveCaption(undefined, 'respaldo'), 'respaldo');
  assert.strictEqual(resolveCaption({ caption_mejorado: '   ' }, 'respaldo'), 'respaldo');
});

test('el pie de foto no menciona la inteligencia artificial', () => {
  for (const tema of ['Mercados', 'Criptomonedas', undefined]) {
    const pie = generateCaption('Titular de prueba', tema);
    assert.doesNotMatch(pie, /inteligencia artificial|generad[oa] con IA|\bIA\b/i);
  }
});

test('la procedencia de la imagen solo se informa al revisor, no en el pie', () => {
  // El origen (archivo, generada, reserva) vive en IMAGE_SOURCE_LABEL, que usa
  // el mensaje de aprobación de Telegram; el pie de foto público no lo toca.
  assert.ok(Object.keys(IMAGE_SOURCE_LABEL).length >= 3);
  assert.doesNotMatch(JSON.stringify(IMAGE_SOURCE_LABEL.fallback_static), /inteligencia artificial/i);
});
