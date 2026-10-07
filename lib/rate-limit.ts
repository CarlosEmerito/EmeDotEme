/**
 * Rate limiting.
 *
 * En producción (Vercel/serverless) cada instancia tiene su propia memoria, por
 * lo que un `Map` local no limita nada de verdad. Si hay configurado un Redis
 * compatible con la API REST de Upstash (`UPSTASH_REDIS_REST_URL/TOKEN` o las
 * variables de Vercel KV `KV_REST_API_URL/TOKEN`), se usa ese backend
 * distribuido; en caso contrario se cae a un store en memoria, válido para
 * desarrollo/tests.
 */

export interface RateLimitOptions {
  /** Máximo de peticiones permitidas dentro de la ventana. Por defecto 5. */
  max?: number;
  /** Tamaño de la ventana en milisegundos. Por defecto 60s. */
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

const DEFAULT_MAX = 5;
const DEFAULT_WINDOW_MS = 60_000;

// ============================================================
// Backend en memoria (fallback)
// ============================================================

const memoryStore = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: max - entry.count };
}

// ============================================================
// Backend distribuido (Upstash Redis REST / Vercel KV)
// ============================================================

function getRedisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ''), token };
}

async function redisRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  const config = getRedisConfig();
  if (!config) throw new Error("Redis no configurado");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    // INCR es atómico; PTTL nos dice si la ventana ya está activa.
    const res = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["PTTL", key],
      ]),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Redis HTTP ${res.status}`);

    const data = (await res.json()) as Array<{ result: number | null }>;
    const count = Number(data[0]?.result ?? 1);
    const ttl = Number(data[1]?.result ?? -1);

    // Si la clave acaba de crearse (ttl < 0), fijamos la ventana una sola vez.
    if (ttl < 0) {
      await fetch(`${config.url}/pexpire/${encodeURIComponent(key)}/${windowMs}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${config.token}` },
        signal: controller.signal,
        cache: "no-store",
      });
    }

    return { allowed: count <= max, remaining: Math.max(0, max - count) };
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================
// API pública
// ============================================================

export async function rateLimit(
  key: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const max = options.max ?? DEFAULT_MAX;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const namespacedKey = `rl:${key}`;

  if (getRedisConfig()) {
    try {
      return await redisRateLimit(namespacedKey, max, windowMs);
    } catch (err) {
      console.warn(
        "[rate-limit] Backend distribuido no disponible, usando memoria:",
        err instanceof Error ? err.message : err
      );
    }
  }

  return memoryRateLimit(namespacedKey, max, windowMs);
}

/** Núcleo compartido: extrae la IP real a partir de cualquier objeto Headers-like. */
export function getClientIpFromHeaders(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") || "127.0.0.1";
}

export function getClientIp(request: Request): string {
  return getClientIpFromHeaders(request.headers);
}
