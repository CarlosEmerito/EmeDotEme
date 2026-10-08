/**
 * Reglas editoriales que comparten el prompt y el código.
 *
 * Están aquí y no repartidas por los módulos para que el prompt (que es texto)
 * y la validación (que es código) no puedan desincronizarse: si se añade un
 * símbolo aquí, el modelo puede usarlo y el validador lo aceptará.
 */

/**
 * Símbolos de criptomonedas que el campo `tickers` admite.
 *
 * Lista cerrada a propósito: sin ella el modelo cuela indistintamente tickers
 * de empresas (MSFT), pares completos (BTC-USD) o monedas fiduciarias (USD).
 */
export const ALLOWED_TICKERS = [
  'BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT',
  'MATIC', 'LTC', 'USDT', 'USDC', 'TON', 'TRX', 'SHIB', 'ARB', 'OP', 'ATOM',
  'XLM', 'HBAR', 'NEAR', 'APT', 'SUI', 'UNI', 'AAVE', 'ETC', 'FIL', 'ALGO',
] as const;

/** Máximo de activos en `tickers`. */
export const MAX_TICKERS = 3;

/** Etiquetas por artículo. Menos de 3 apenas clasifica; más de 5 fragmenta. */
export const MIN_TAGS = 3;
export const MAX_TAGS = 5;

/** Cuántas etiquetas ya existentes se le enseñan al modelo para reutilizarlas. */
export const EXISTING_TAGS_IN_PROMPT = 40;

/**
 * Cuántas fuentes del clúster se descargan enteras. Una sola fuente basta para
 * escribir con datos; dos permiten contrastar cifras cuando hay versiones
 * distintas del mismo hecho.
 */
export const FULL_TEXT_SOURCES = 2;

/**
 * Tope de caracteres por fuente completa. Un artículo de prensa ronda los
 * 3.000-6.000 caracteres; 12.000 deja margen sin disparar el coste de tokens
 * ni acercarse al límite de contexto del modelo.
 */
export const MAX_SOURCE_CHARS = 12000;
