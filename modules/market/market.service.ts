// Módulo de mercado: obtiene datos de criptomonedas desde CoinGecko o CoinCap
export type Coin = {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap?: number;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
  circulating_supply?: number;
};

/**
 * Obtiene los datos del mercado en vivo desde CoinGecko o CoinCap como respaldo.
 */
export async function getMarketData(): Promise<Coin[]> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=false',
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {}
  
  try {
    const fallbackRes = await fetch('https://api.coincap.io/v2/assets?limit=15', {
      next: { revalidate: 60 }
    });
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      return data.data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        current_price: parseFloat(coin.priceUsd),
        price_change_percentage_24h: parseFloat(coin.changePercent24Hr)
      }));
    }
  } catch (error) {}
  
  return [];
}

/**
 * Obtiene los datos detallados de una moneda específica por su símbolo (ej: BTC).
 */
export async function getCoinDataBySymbol(symbol: string): Promise<Coin | null> {
  const cleanSymbol = symbol.toLowerCase().trim();
  try {
    // Intentar buscar por símbolo en la lista de los top 250 de CoinGecko
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false`,
      { next: { revalidate: 300 } } // 5 min cache
    );
    if (res.ok) {
      const data: Coin[] = await res.json();
      const coin = data.find(c => c.symbol.toLowerCase() === cleanSymbol);
      if (coin) return coin;
    }
  } catch (err) {}

  // Fallback a CoinCap si falla CoinGecko o no se encuentra en el top 250
  try {
    const res = await fetch(`https://api.coincap.io/v2/assets?search=${cleanSymbol}`, {
      next: { revalidate: 300 }
    });
    if (res.ok) {
      const { data } = await res.json();
      const coin = data[0]; // Coge el primer resultado
      if (coin && coin.symbol.toLowerCase() === cleanSymbol) {
        return {
          id: coin.id,
          symbol: coin.symbol,
          name: coin.name,
          current_price: parseFloat(coin.priceUsd),
          price_change_percentage_24h: parseFloat(coin.changePercent24Hr),
          market_cap: parseFloat(coin.marketCapUsd),
          total_volume: parseFloat(coin.volumeUsd24Hr)
        };
      }
    }
  } catch (err) {}

  return null;
}

/**
 * Obtiene los datos históricos de precio para una moneda.
 * @param coinId El ID de la moneda en CoinGecko (ej: 'bitcoin').
 * @param days Número de días de historial (default: 7).
 */
export async function getHistoricalData(coinId: string, days: string = '7'): Promise<[number, number][]> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
      { next: { revalidate: 3600 } } // 1 hour cache
    );
    if (res.ok) {
      const data = await res.json();
      return data.prices; // Array of [timestamp, price]
    }
  } catch (error) {
    console.error(`Error fetching historical data for ${coinId}:`, error);
  }
  return [];
}

