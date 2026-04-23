import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { sanitizeJsonString } from '../lib/json-sanitizer';

describe('JSON Sanitizer', () => {
  it('should fix unescaped bad characters like literal newlines in strings', () => {
    const input = '{"title": "Line 1\nLine 2"}';
    const sanitized = sanitizeJsonString(input);
    const parsed = JSON.parse(sanitized);
    assert.strictEqual(parsed.title, 'Line 1\nLine 2');
  });

  it('should fix invalid escape sequences', () => {
    // A string literally containing a backslash followed by 'x'
    const input = '{"title": "Title \\xbad"}';
    const sanitized = sanitizeJsonString(input);
    const parsed = JSON.parse(sanitized);
    assert.strictEqual(parsed.title, 'Title \\xbad');
  });

  it('should handle tabs correctly', () => {
    const input = '{"title": "Title \t Tab"}';
    const sanitized = sanitizeJsonString(input);
    const parsed = JSON.parse(sanitized);
    assert.strictEqual(parsed.title, 'Title \t Tab');
  });

  it('should leave valid JSON intact', () => {
    const input = '{"title": "Valid", "num": 123, "bool": true}';
    const sanitized = sanitizeJsonString(input);
    assert.deepStrictEqual(JSON.parse(sanitized), { title: "Valid", num: 123, bool: true });
  });

  it('should correctly escape carriage returns', () => {
    const input = '{"content": "A\rB"}';
    const sanitized = sanitizeJsonString(input);
    const parsed = JSON.parse(sanitized);
    assert.strictEqual(parsed.content, 'A\rB');
  });
});
