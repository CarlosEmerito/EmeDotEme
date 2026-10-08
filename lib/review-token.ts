/**
 * Tokens del flujo de revisión editorial.
 *
 * Un borrador generado por el pipeline no se publica: se guarda con un token
 * aleatorio de 128 bits (`reviewToken`) que viaja en dos sitios y solo en dos:
 *
 *  1. El enlace privado que se manda al Telegram de Emérito (`/preview/<token>`).
 *  2. El `callback_data` de los tres botones del mensaje de Telegram.
 *
 * No hace falta firmar nada: sin el token no se puede abrir el borrador ni
 * actuar sobre él, y las acciones por botón comprueban además que quien pulsa
 * es el chat del dueño. El token se genera con `crypto.getRandomValues`, no con
 * `Math.random`.
 */

const TOKEN_BYTES = 16;

/** Genera un token de 32 caracteres hexadecimales (128 bits). */
export function generateReviewToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Acciones posibles de los tres botones:
 *  - `y` → sí, publicar (web + redes).
 *  - `n` → no, descartar el borrador.
 *  - `h` → que EmeDotHermes lo revise y devuelva un diagnóstico.
 */
export const REVIEW_ACTIONS = ['y', 'n', 'h'] as const;
export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

/** Telegram limita `callback_data` a 64 bytes: `apr.y.` (6) + 32 = 38. */
export function buildCallbackData(action: ReviewAction, token: string): string {
  return `apr.${action}.${token}`;
}

export function parseCallbackData(data: unknown): { action: ReviewAction; token: string } | null {
  if (typeof data !== 'string') return null;
  const match = /^apr\.([ynh])\.([0-9a-f]{32})$/.exec(data);
  if (!match) return null;
  return { action: match[1] as ReviewAction, token: match[2] };
}

export function buildPreviewUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/preview/${token}`;
}

export const REVIEW_STATUS = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  hermesReview: 'hermes_review',
} as const;
