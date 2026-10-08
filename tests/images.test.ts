import { test } from 'node:test';
import assert from 'node:assert';
import { buildStockQuery } from '../modules/images/stock-image.service.ts';
import { pickFallbackImage } from '../modules/images/image.service.ts';
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
