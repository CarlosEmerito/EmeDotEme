import { describe, it } from "node:test";
import assert from "node:assert";
import { applyReviewDecision, type ReviewDb } from "../modules/articles/review.service.js";
import { generateReviewToken } from "../lib/review-token.js";

/**
 * Base de datos de mentira: guarda un artículo en memoria y registra las
 * escrituras. Así se prueba la decisión editorial sin Postgres ni Telegram.
 */
function fakeDb(article: Record<string, unknown> | null) {
  const updates: Record<string, unknown>[] = [];
  const store = article ? { ...article } : null;

  const db: ReviewDb & { updates: typeof updates; store: typeof store } = {
    updates,
    store,
    article: {
      async findUnique() {
        return store;
      },
      async update(args: { data: Record<string, unknown> }) {
        assert.ok(store, "update sin artículo en la base de datos de prueba");
        Object.assign(store, args.data);
        updates.push(args.data);
        return store;
      },
    },
  };
  return db;
}

const TOKEN = "0123456789abcdef0123456789abcdef";

describe("decisión editorial (botones de Telegram)", () => {
  it("«sí» publica el borrador y marca la fecha de revisión", async () => {
    const now = new Date("2026-10-08T20:00:00Z");
    const db = fakeDb({ id: "a1", title: "Titular", slug: "titular", published: false, reviewStatus: "pending" });

    const outcome = await applyReviewDecision(db, TOKEN, "y", now);

    assert.strictEqual(outcome.ok, true);
    assert.strictEqual(outcome.published, true);
    assert.strictEqual(outcome.slug, "titular");
    assert.deepStrictEqual(db.updates[0], {
      published: true,
      publishedAt: now,
      reviewStatus: "approved",
      reviewedAt: now,
    });
  });

  it("«sí» dos veces no vuelve a publicar ni cambia fechas", async () => {
    const db = fakeDb({ id: "a1", title: "Titular", slug: "titular", published: true, reviewStatus: "approved" });

    const outcome = await applyReviewDecision(db, TOKEN, "y");

    assert.strictEqual(outcome.ok, true);
    assert.strictEqual(db.updates.length, 0);
    assert.match(outcome.message, /Ya estaba publicado/);
  });

  it("«no» descarta el borrador y lo deja fuera de la web", async () => {
    const db = fakeDb({ id: "a1", title: "Titular", slug: "titular", published: false, reviewStatus: "pending" });

    const outcome = await applyReviewDecision(db, TOKEN, "n");

    assert.strictEqual(outcome.ok, true);
    assert.strictEqual(outcome.published, false);
    assert.strictEqual(db.updates[0].reviewStatus, "rejected");
    assert.strictEqual(db.updates[0].published, false);
    assert.strictEqual(db.updates[0].announcedAt, null);
  });

  it("«EmeDotHermes» pide el diagnóstico sin publicar nada", async () => {
    const db = fakeDb({ id: "a1", title: "Titular", slug: "titular", published: false, reviewStatus: "pending" });

    const outcome = await applyReviewDecision(db, TOKEN, "h");

    assert.strictEqual(outcome.ok, true);
    assert.strictEqual(outcome.published, false);
    assert.strictEqual(db.updates[0].reviewStatus, "hermes_review");
    assert.strictEqual("published" in db.updates[0], false);
  });

  it("un token que no existe no toca la base de datos", async () => {
    const db = fakeDb(null);

    const outcome = await applyReviewDecision(db, generateReviewToken(), "y");

    assert.strictEqual(outcome.ok, false);
    assert.strictEqual(db.updates.length, 0);
  });
});
