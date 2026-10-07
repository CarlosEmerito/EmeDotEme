/**
 * Tokens firmados (HMAC-SHA256) para el enlace de baja de la newsletter.
 *
 * Sin token, cualquiera que conozca el email de un suscriptor podría darlo de
 * baja con una simple petición GET. Firmamos `email` + token para que solo el
 * enlace que enviamos por correo pueda desactivar la suscripción.
 */

const encoder = new TextEncoder();

function getSecret(): string | null {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Comparación en tiempo (casi) constante para evitar timing attacks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function sign(email: string): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error("No hay SESSION_SECRET/ADMIN_PASSWORD configurado para firmar enlaces");

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`unsubscribe:${normalizeEmail(email)}`)
  );
  return toBase64Url(new Uint8Array(signature));
}

export async function createUnsubscribeToken(email: string): Promise<string> {
  return sign(email);
}

export async function verifyUnsubscribeToken(email: string, token: string | null): Promise<boolean> {
  if (!token) return false;
  try {
    return safeEqual(await sign(email), token);
  } catch {
    return false;
  }
}
