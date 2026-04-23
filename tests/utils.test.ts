import { test } from 'node:test';
import assert from 'node:assert';
import { generateSlug } from '../lib/slug.ts';

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
