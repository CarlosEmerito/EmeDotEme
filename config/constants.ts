/**
 * Constantes compartidas del proyecto EmeDotEme.
 * Centraliza valores que se usaban duplicados en múltiples archivos.
 */

// ============================================================
// IMÁGENES DE FALLBACK (Unsplash)
// ============================================================

/**
 * Imágenes de stock por categoría usadas como fallback cuando no se puede
 * obtener ni generar una imagen para un artículo.
 */
export const FALLBACK_IMAGES: Record<string, string[]> = {
  "Mercados": [
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1605792657660-596af9009e82?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1641337424160-5a3d7d745fcd?q=80&w=1200&auto=format&fit=crop",
  ],
  "Tecnología": [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop",
  ],
  "Web3": [
    "https://images.unsplash.com/photo-1639762681485-074b7f4f039a?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1639762681057-408e52192e55?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?q=80&w=1200&auto=format&fit=crop",
  ],
};

// ============================================================
// SIGLAS Y ACRÓNIMOS (mantener en MAYÚSCULAS)
// ============================================================

/**
 * Lista de siglas que deben mantenerse en mayúsculas al aplicar sentence case.
 */
export const CRYPTO_ACRONYMS: string[] = [
  'BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOT', 'AVAX', 'MATIC', 'DOGE', 'SHIB', 'TON', 'BNB',
  'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KRW',
  'ETF', 'SEC', 'CFTC', 'FED', 'ECB', 'IMF', 'WTO', 'FINMA', 'ESMA',
  'AI', 'API', 'NFT', 'DAO', 'DEFI', 'CEFI', 'WEB3', 'KYC', 'AML',
  'USA', 'EEUU', 'UK', 'EU', 'ONU',
  'BTC-USD', 'ETH-USD', 'XRP-USD',
  'S&P', 'S&P 500', 'NASDAQ', 'NYSE', 'FTSE', 'DAX', 'CAC',
];

// ============================================================
// NOMBRES PROPIOS (capitalización correcta)
// ============================================================

/**
 * Mapeo de nombres propios (lowercase → forma correcta) para normalización
 * automática de textos generados por IA.
 */
export const PROPER_NOUNS: Record<string, string> = {
    'cz': 'CZ',
    'star xu': 'Star Xu',
    'satoshi nakamoto': 'Satoshi Nakamoto',
    'vitalik buterin': 'Vitalik Buterin',
    'changpeng zhao': 'Changpeng Zhao',
  'bitcoin': 'Bitcoin',
  'ethereum': 'Ethereum',
  'solana': 'Solana',
  'cardano': 'Cardano',
  'polkadot': 'Polkadot',
  'polygon': 'Polygon',
  'avalanche': 'Avalanche',
  'ripple': 'Ripple',
  'binance': 'Binance',
  'coinbase': 'Coinbase',
  'kraken': 'Kraken',
  'telegram': 'Telegram',
  'whatsapp': 'WhatsApp',
  'instagram': 'Instagram',
  'twitter': 'Twitter',
  'facebook': 'Facebook',
  'youtube': 'YouTube',
  'glassnode': 'Glassnode',
  'coingecko': 'CoinGecko',
  'coinmetrics': 'CoinMetrics',
  'deribit': 'Deribit',
  'kaiko': 'Kaiko',
  'jpmorgan': 'JP Morgan',
  'goldman sachs': 'Goldman Sachs',
  'blackrock': 'BlackRock',
  'fidelity': 'Fidelity',
  'vanguard': 'Vanguard',
};

/**
 * Mapeo ampliado usado en normalizeArticleContent.
 * Incluye PROPER_NOUNS + términos técnicos adicionales.
 */
export const TERMS_TO_CAPITALIZE: Record<string, string> = {
    'cz': 'CZ',
    'star xu': 'Star Xu',
    'satoshi nakamoto': 'Satoshi Nakamoto',
    'vitalik buterin': 'Vitalik Buterin',
    'changpeng zhao': 'Changpeng Zhao',
  ...PROPER_NOUNS,
  'etf': 'ETF',
  'defi': 'DeFi',
  'nft': 'NFT',
  'web3': 'Web3',
  'dao': 'DAO',
  'sec': 'SEC',
  'cftc': 'CFTC',
  'fed': 'FED',
  'ecb': 'ECB',
  'imf': 'IMF',
  'usd': 'USD',
  'eur': 'EUR',
  'gbp': 'GBP',
  'jpy': 'JPY',
  'cny': 'CNY',
};

// ============================================================
// CATEGORÍAS BASE
// ============================================================

export const BASE_CATEGORIES = ["Mercados", "Tecnología", "Web3"] as const;
