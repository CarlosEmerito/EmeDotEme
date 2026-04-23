import { test } from 'node:test';
import assert from 'node:assert';
import { generateSlug } from '../lib/slug.ts';
import { formatRelativeDate } from '../lib/utils.ts';

test('generateSlug - basic conversion', () => {
  const title = 'Hello World';
  const slug = generateSlug(title, false);
  assert.strictEqual(slug, 'hello-world');
});

test('generateSlug - special characters', () => {
  const title = 'Hello World! @#$%^&*()';
  const slug = generateSlug(title, false);
  assert.strictEqual(slug, 'hello-world');
});

test('generateSlug - leading and trailing spaces', () => {
  const title = '  Hello World  ';
  const slug = generateSlug(title, false);
  assert.strictEqual(slug, 'hello-world');
});

test('generateSlug - multiple spaces and hyphens', () => {
  const title = 'Hello   World---Test';
  const slug = generateSlug(title, false);
  assert.strictEqual(slug, 'hello-world-test');
});

test('generateSlug - empty string', () => {
  const title = '';
  const slug = generateSlug(title, false);
  assert.strictEqual(slug, '');
});

test('generateSlug - only special characters', () => {
  const title = '!!!';
  const slug = generateSlug(title, false);
  assert.strictEqual(slug, '');
});

test('generateSlug - with timestamp', () => {
  const title = 'Hello World';
  const slug = generateSlug(title, true);
  assert.match(slug, /^hello-world-\d+$/);
});

test('generateSlug - numbers', () => {
  const title = 'Post 123';
  const slug = generateSlug(title, false);
  assert.strictEqual(slug, 'post-123');
});

test('generateSlug - mixed alphanumeric', () => {
  const title = 'iPhone 15 Pro Max';
  const slug = generateSlug(title, false);
  assert.strictEqual(slug, 'iphone-15-pro-max');
});

test('formatRelativeDate - seconds ago', () => {
  const date = new Date(Date.now() - 30 * 1000); // 30 seconds ago
  assert.strictEqual(formatRelativeDate(date), 'hace unos segundos');
});

test('formatRelativeDate - exactly 1 minute ago', () => {
  const date = new Date(Date.now() - 60 * 1000); // exactly 1 minute ago
  assert.strictEqual(formatRelativeDate(date), 'hace 1 minuto');
});

test('formatRelativeDate - multiple minutes ago', () => {
  const date = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
  assert.strictEqual(formatRelativeDate(date), 'hace 5 minutos');
});

test('formatRelativeDate - exactly 1 hour ago', () => {
  const date = new Date(Date.now() - 60 * 60 * 1000); // exactly 1 hour ago
  assert.strictEqual(formatRelativeDate(date), 'hace 1 hora');
});

test('formatRelativeDate - multiple hours ago', () => {
  const date = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
  assert.strictEqual(formatRelativeDate(date), 'hace 3 horas');
});

test('formatRelativeDate - more than 24 hours ago', () => {
  const date = new Date('2023-01-15T12:00:00Z');
  const formattedDate = date.toLocaleDateString("es-ES", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  assert.strictEqual(formatRelativeDate(date), formattedDate);
});

test('formatRelativeDate - input as string', () => {
  const date = new Date(Date.now() - 30 * 1000);
  assert.strictEqual(formatRelativeDate(date.toISOString()), 'hace unos segundos');
});

test('formatRelativeDate - input as number (timestamp)', () => {
  const timestamp = Date.now() - 30 * 1000;
  assert.strictEqual(formatRelativeDate(timestamp), 'hace unos segundos');
});
