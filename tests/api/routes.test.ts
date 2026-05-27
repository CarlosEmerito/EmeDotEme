import { describe, it } from "node:test";
import assert from "node:assert";

const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("/api/health", () => {
  it("returns 200 with healthy status", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, "healthy");
  });
});

describe("/api/contact", () => {
  it("returns 400 on missing fields", async () => {
    const res = await fetch(`${baseUrl}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", email: "", message: "" }),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 400);
    assert.ok(body.error);
  });

  it("returns 400 on invalid email", async () => {
    const res = await fetch(`${baseUrl}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test", email: "invalid", message: "Hello" }),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.error, "Email inválido");
  });

  it("returns 429 on rate limit (6 requests)", async () => {
    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      const res = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test", email: "t@t.com", message: "X" }),
      });
      lastStatus = res.status;
    }
    assert.strictEqual(lastStatus, 429);
  });
});

describe("/api/subscribe", () => {
  it("returns 400 on missing email", async () => {
    const res = await fetch(`${baseUrl}/api/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res.status, 400);
  });
});
