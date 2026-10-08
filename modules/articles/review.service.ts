import { REVIEW_STATUS, type ReviewAction } from '../../lib/review-token';

/**
 * Lógica de la decisión editorial, separada del transporte.
 *
 * El webhook de Telegram solo se encarga de HTTP y de hablar con la API de
 * Telegram; quién cambia de estado en la base de datos está aquí, para poder
 * probarlo sin red y sin Telegram (ver `tests/review-decision.test.ts`).
 */

/** Cliente mínimo que necesita esta lógica (Prisma lo cumple). */
export interface ReviewDb {
  article: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findUnique(args: any): Promise<any | null>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update(args: any): Promise<any>;
  };
}

export interface ReviewOutcome {
  /** La acción se ha aplicado (o ya estaba aplicada). */
  ok: boolean;
  /** Texto con el que se reescribe el mensaje de Telegram. */
  message: string;
  /** Slug del artículo, para poder refrescar su página. */
  slug?: string;
  /** Si tras la acción el artículo queda visible en la web. */
  published?: boolean;
}

export async function applyReviewDecision(
  db: ReviewDb,
  token: string,
  action: ReviewAction,
  now: Date = new Date()
): Promise<ReviewOutcome> {
  const article = await db.article.findUnique({ where: { reviewToken: token } });

  if (!article) {
    return { ok: false, message: '⚠️ No encuentro el borrador de este botón. Puede haber caducado.' };
  }

  if (action === 'y') {
    if (article.published && article.reviewStatus === REVIEW_STATUS.approved) {
      return {
        ok: true,
        published: true,
        slug: article.slug,
        message: `✅ Ya estaba publicado: <b>${escape(article.title)}</b>`,
      };
    }
    const updated = await db.article.update({
      where: { id: article.id },
      data: {
        published: true,
        publishedAt: now,
        reviewStatus: REVIEW_STATUS.approved,
        reviewedAt: now,
      },
    });
    return {
      ok: true,
      published: true,
      slug: updated.slug,
      message: `✅ <b>Publicado en la web.</b> El anuncio en Telegram, Binance Square y Bluesky sale en la siguiente ejecución del publicador.\n\n${escape(article.title)}`,
    };
  }

  if (action === 'n') {
    const updated = await db.article.update({
      where: { id: article.id },
      data: {
        published: false,
        publishedAt: null,
        reviewStatus: REVIEW_STATUS.rejected,
        reviewedAt: now,
        announcedAt: null,
      },
    });
    return {
      ok: true,
      published: false,
      slug: updated.slug,
      message: `🗑️ <b>Descartado.</b> No se ha publicado en ningún sitio.\n\n${escape(article.title)}`,
    };
  }

  // 'h' — EmeDotHermes: no se decide nada todavía, se pide un diagnóstico.
  const updated = await db.article.update({
    where: { id: article.id },
    data: { reviewStatus: REVIEW_STATUS.hermesReview, reviewedAt: now },
  });
  return {
    ok: true,
    published: false,
    slug: updated.slug,
    message: `🤖 <b>EmeDotHermes lo está revisando.</b> Te mando el diagnóstico por aquí en cuanto lo tenga; decides después.\n\n${escape(article.title)}`,
  };
}

function escape(text: unknown): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
