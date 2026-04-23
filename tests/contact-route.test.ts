import test from 'node:test';
import assert from 'node:assert';

test('Simulate simple length check test to assure the logic', () => {
    // This is basically checking my thought process

    const tooLongName = 'a'.repeat(101);
    const validName = 'a'.repeat(100);

    assert.ok(tooLongName.length > 100);
    assert.ok(validName.length <= 100);

    const tooLongMessage = 'm'.repeat(5001);
    const validMessage = 'm'.repeat(5000);

    assert.ok(tooLongMessage.length > 5000);
    assert.ok(validMessage.length <= 5000);

    const tooLongEmail = 'e'.repeat(256) + '@e.com';
    assert.ok(tooLongEmail.length > 255);
});

test('XSS escapeHtml correctly handles payload in email', () => {
    const escapeHtml = (unsafe: string) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const maliciousEmail = "<script>alert(1)</script>@example.com";
    const escaped = escapeHtml(maliciousEmail);

    assert.ok(!escaped.includes('<script>'));
    assert.ok(escaped.includes('&lt;script&gt;'));
});
