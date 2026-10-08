import { test } from 'node:test';
import assert from 'node:assert';
import { resolveImageUrl, extractImageFromHtml } from '../modules/images/source-image.service.ts';
import { buildStockQuery } from '../modules/images/stock-image.service.ts';
import { pickFallbackImage } from '../modules/images/image.service.ts';

const BASE = 'https://ejemplo.com/noticia/mi-articulo';

// ─── resolveImageUrl ─────────────────────────────────────────────────────────

test('resolveImageUrl - resuelve rutas relativas contra la base', () => {
  assert.strictEqual(
    resolveImageUrl('/img/foto.jpg', BASE),
    'https://ejemplo.com/img/foto.jpg'
  );
});

test('resolveImageUrl - resuelve rutas relativas sin barra inicial', () => {
  assert.strictEqual(
    resolveImageUrl('img/foto.jpg', BASE),
    'https://ejemplo.com/noticia/img/foto.jpg'
  );
});

test('resolveImageUrl - añade https a las URLs protocol-relative', () => {
  assert.strictEqual(
    resolveImageUrl('//cdn.ejemplo.com/foto.jpg', BASE),
    'https://cdn.ejemplo.com/foto.jpg'
  );
});

test('resolveImageUrl - decodifica entidades HTML de los atributos', () => {
  assert.strictEqual(
    resolveImageUrl('https://cdn.ejemplo.com/f.jpg?w=1&amp;h=2', BASE),
    'https://cdn.ejemplo.com/f.jpg?w=1&h=2'
  );
});

test('resolveImageUrl - descarta vacíos y data URIs', () => {
  assert.strictEqual(resolveImageUrl('', BASE), null);
  assert.strictEqual(resolveImageUrl(undefined, BASE), null);
  assert.strictEqual(resolveImageUrl('data:image/png;base64,AAAA', BASE), null);
});

// ─── extractImageFromHtml ────────────────────────────────────────────────────

test('extractImageFromHtml - lee og:image con property antes de content', () => {
  const html = '<meta property="og:image" content="https://cdn.ejemplo.com/a.jpg">';
  assert.strictEqual(extractImageFromHtml(html, BASE), 'https://cdn.ejemplo.com/a.jpg');
});

test('extractImageFromHtml - lee og:image con content antes de property', () => {
  const html = '<meta content="https://cdn.ejemplo.com/b.jpg" property="og:image">';
  assert.strictEqual(extractImageFromHtml(html, BASE), 'https://cdn.ejemplo.com/b.jpg');
});

test('extractImageFromHtml - usa twitter:image si no hay og:image', () => {
  const html = '<meta name="twitter:image" content="https://cdn.ejemplo.com/c.jpg">';
  assert.strictEqual(extractImageFromHtml(html, BASE), 'https://cdn.ejemplo.com/c.jpg');
});

test('extractImageFromHtml - resuelve la imagen relativa que declara el medio', () => {
  const html = '<meta property="og:image" content="/media/2026/foto.webp">';
  assert.strictEqual(extractImageFromHtml(html, BASE), 'https://ejemplo.com/media/2026/foto.webp');
});

test('extractImageFromHtml - descarta sprites y logos y coge la siguiente candidata', () => {
  const html = `
    <meta property="og:image" content="https://cdn.ejemplo.com/sprite-social.png">
    <meta name="twitter:image" content="https://cdn.ejemplo.com/noticia-real.jpg">
  `;
  assert.strictEqual(extractImageFromHtml(html, BASE), 'https://cdn.ejemplo.com/noticia-real.jpg');
});

test('extractImageFromHtml - ignora candidatas que no son imágenes', () => {
  const html = '<meta property="og:image" content="https://ejemplo.com/pagina-no-imagen">';
  assert.strictEqual(extractImageFromHtml(html, BASE), null);
});

test('extractImageFromHtml - recurre al JSON-LD cuando no hay metadatos og', () => {
  const html = `
    <script type="application/ld+json">
      {"@type":"NewsArticle","headline":"Algo","image":{"@type":"ImageObject","url":"https://cdn.ejemplo.com/ld.jpg"}}
    </script>
  `;
  assert.strictEqual(extractImageFromHtml(html, BASE), 'https://cdn.ejemplo.com/ld.jpg');
});

test('extractImageFromHtml - no se rompe con JSON-LD mal formado', () => {
  const html = `
    <script type="application/ld+json">{esto no es json}</script>
    <meta property="og:image" content="https://cdn.ejemplo.com/ok.jpg">
  `;
  assert.strictEqual(extractImageFromHtml(html, BASE), 'https://cdn.ejemplo.com/ok.jpg');
});

test('extractImageFromHtml - devuelve null si el HTML no declara ninguna imagen', () => {
  assert.strictEqual(extractImageFromHtml('<html><body>Sin metadatos</body></html>', BASE), null);
  assert.strictEqual(extractImageFromHtml('', BASE), null);
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
  const url = pickFallbackImage('Criptomonedas');
  assert.ok(url.startsWith('https://'), 'debe ser una URL absoluta');
});

test('pickFallbackImage - siempre devuelve algo, aunque la categoría no exista', () => {
  const url = pickFallbackImage('CategoríaInexistente');
  assert.ok(url.startsWith('https://'), 'debe devolver una imagen de reserva igualmente');
  assert.ok(pickFallbackImage(undefined).startsWith('https://'));
});
