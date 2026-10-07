import { describe, it } from "node:test";
import assert from "node:assert";
import { rateLimit, getClientIp } from "../../lib/rate-limit.js";

describe("rateLimit", () => {
  it("allows first 5 requests", async () => {
    for (let i = 0; i < 5; i++) {
      const { allowed, remaining } = await rateLimit("test-key");
      assert.strictEqual(allowed, true);
      assert.strictEqual(remaining, 4 - i);
    }
  });

  it("blocks 6th request", async () => {
    for (let i = 0; i < 5; i++) await rateLimit("test-key-2");
    const { allowed } = await rateLimit("test-key-2");
    assert.strictEqual(allowed, false);
  });

  it("respeta max y windowMs personalizados", async () => {
    const first = await rateLimit("custom-key", { max: 1, windowMs: 60_000 });
    assert.strictEqual(first.allowed, true);
    const second = await rateLimit("custom-key", { max: 1, windowMs: 60_000 });
    assert.strictEqual(second.allowed, false);
    assert.strictEqual(second.remaining, 0);
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
