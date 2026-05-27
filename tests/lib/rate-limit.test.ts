import { describe, it } from "node:test";
import assert from "node:assert";
import { rateLimit, getClientIp } from "../../lib/rate-limit.js";

describe("rateLimit", () => {
  it("allows first 5 requests", () => {
    for (let i = 0; i < 5; i++) {
      const { allowed, remaining } = rateLimit("test-key");
      assert.strictEqual(allowed, true);
      assert.strictEqual(remaining, 4 - i);
    }
  });

  it("blocks 6th request", () => {
    for (let i = 0; i < 5; i++) rateLimit("test-key-2");
    const { allowed } = rateLimit("test-key-2");
    assert.strictEqual(allowed, false);
  });
});

describe("getClientIp", () => {
  it("reads from x-forwarded-for", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    assert.strictEqual(getClientIp(req), "1.2.3.4");
  });

  it("falls back to 127.0.0.1", () => {
    const req = new Request("https://example.com");
    assert.strictEqual(getClientIp(req), "127.0.0.1");
  });
});
