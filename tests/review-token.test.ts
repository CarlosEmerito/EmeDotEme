import { describe, it } from "node:test";
import assert from "node:assert";
import {
  buildCallbackData,
  buildPreviewUrl,
  generateReviewToken,
  parseCallbackData,
} from "../lib/review-token.js";

describe("token del borrador (enlace privado)", () => {
  it("genera 32 hex y no repite", () => {
    const a = generateReviewToken();
    const b = generateReviewToken();
    assert.match(a, /^[0-9a-f]{32}$/);
    assert.match(b, /^[0-9a-f]{32}$/);
    assert.notStrictEqual(a, b);
  });

  it("construye la URL privada sin duplicar barras", () => {
    assert.strictEqual(
      buildPreviewUrl("https://www.emedoteme.es/", "abc123"),
      "https://www.emedoteme.es/preview/abc123"
    );
    assert.strictEqual(
      buildPreviewUrl("https://www.emedoteme.es", "abc123"),
      "https://www.emedoteme.es/preview/abc123"
    );
  });
});

describe("callback_data de los botones", () => {
  it("ida y vuelta para las tres acciones", () => {
    const token = generateReviewToken();
    for (const action of ["y", "n", "h"] as const) {
      const parsed = parseCallbackData(buildCallbackData(action, token));
      assert.deepStrictEqual(parsed, { action, token });
    }
  });

  it("cabe en los 64 bytes que admite Telegram", () => {
    const data = buildCallbackData("y", generateReviewToken());
    assert.ok(Buffer.byteLength(data, "utf8") <= 64, `demasiado largo: ${data}`);
  });

  it("rechaza formatos raros o manipulados", () => {
    const token = generateReviewToken();
    for (const bad of [
      undefined,
      null,
      42,
      "",
      `apr.x.${token}`,
      `apr.y.${token.slice(0, 31)}`,
      `apr.y.${token.toUpperCase()}`,
      `apr.y.${token}.extra`,
      `otro.y.${token}`,
    ]) {
      assert.strictEqual(parseCallbackData(bad as unknown), null, `debería rechazar: ${String(bad)}`);
    }
  });
});
