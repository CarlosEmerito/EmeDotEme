import { describe, it } from "node:test";
import assert from "node:assert";
import { createUnsubscribeToken, verifyUnsubscribeToken } from "../../lib/unsubscribe-token.js";

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-secret-unsubscribe";

describe("unsubscribe token", () => {
  it("valida un token correcto (ignora mayúsculas/espacios del email)", async () => {
    const token = await createUnsubscribeToken("User@Example.com");
    assert.strictEqual(await verifyUnsubscribeToken("user@example.com", token), true);
    assert.strictEqual(await verifyUnsubscribeToken("  USER@example.com ", token), true);
  });

  it("rechaza un token manipulado", async () => {
    const token = await createUnsubscribeToken("user@example.com");
    const tampered = token.slice(0, -1) + (token.endsWith("x") ? "y" : "x");
    assert.strictEqual(await verifyUnsubscribeToken("user@example.com", tampered), false);
  });

  it("rechaza un token de otro email", async () => {
    const token = await createUnsubscribeToken("user@example.com");
    assert.strictEqual(await verifyUnsubscribeToken("otro@example.com", token), false);
  });

  it("rechaza token ausente", async () => {
    assert.strictEqual(await verifyUnsubscribeToken("user@example.com", null), false);
  });
});
