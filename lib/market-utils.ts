/**
 * Utilidades para manejar tickers y mercados.
 */

// Lista de tickers comunes que NO son criptomonedas
export const NON_CRYPTO_TICKERS = [
  'MSFT', 'AAPL', 'GOOG', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 
  'NFLX', 'DIS', 'PYPL', 'ADBE', 'INTC', 'CSCO', 'PEP', 'KO',
  'V', 'MA', 'BABA', 'TSM', 'ASML', 'COST', 'AVGO', 'ORCL', 'ACN'
];

/**
 * Verifica si un ticker es probablemente una criptomoneda.
 * Por ahora es una comprobación heurística básica.
 */
export function isLikelyCrypto(ticker: string): boolean {
  if (!ticker) return false;
  const upper = ticker.toUpperCase();
  return !NON_CRYPTO_TICKERS.includes(upper);
}
