const FETCH_TIMEOUT = 5000;

function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

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

export async function getMarketData(limit: number = 15): Promise<Coin[]> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`,
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  try {
    const fallbackRes = await fetch(`https://api.coincap.io/v2/assets?limit=${limit}`, {
      next: { revalidate: 60 }
    });
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      return data.data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`,
        current_price: parseFloat(coin.priceUsd),
        price_change_percentage_24h: parseFloat(coin.changePercent24Hr),
        market_cap: parseFloat(coin.marketCapUsd),
        total_volume: parseFloat(coin.volumeUsd24Hr),
      }));
    }
  } catch {}

  return [];
}

export async function getCoinDataBySymbol(symbol: string): Promise<Coin | null> {
  const cleanSymbol = symbol.toLowerCase().trim();

  try {
    const searchRes = await fetchWithTimeout(
      `https://api.coingecko.com/api/v3/search?query=${cleanSymbol}`,
      { next: { revalidate: 300 } }
    );
    if (searchRes.ok) {
      const { coins } = await searchRes.json();
      if (coins && coins.length > 0) {
        const id = coins[0].id;
        const marketsRes = await fetchWithTimeout(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(id)}&per_page=1&sparkline=false`,
          { next: { revalidate: 300 } }
        );
        if (marketsRes.ok) {
          const data: Coin[] = await marketsRes.json();
          if (data.length > 0) return data[0];
        }
      }
    }
  } catch {}

  try {
    const res = await fetchWithTimeout(
      `https://api.coincap.io/v2/assets?search=${cleanSymbol}`,
      { next: { revalidate: 300 } }
    );
    if (res.ok) {
      const { data } = await res.json();
      const coin = data[0];
      if (coin && coin.symbol.toLowerCase() === cleanSymbol) {
        return {
          id: coin.id,
          symbol: coin.symbol,
          name: coin.name,
          image: `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`,
          current_price: parseFloat(coin.priceUsd),
          price_change_percentage_24h: parseFloat(coin.changePercent24Hr),
          market_cap: parseFloat(coin.marketCapUsd),
          total_volume: parseFloat(coin.volumeUsd24Hr),
        };
      }
    }
  } catch {}

  return null;
}

export async function getHistoricalData(coinId: string, days: string = '7'): Promise<{ prices: [number, number][], total_volumes: [number, number][] }> {
  try {
    const res = await fetchWithTimeout(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      return {
        prices: data.prices,
        total_volumes: data.total_volumes,
      };
    }
  } catch {}

  try {
    let interval = 'd1';
    if (days === '1') interval = 'm15';
    else if (parseInt(days) <= 7) interval = 'h1';
    else if (parseInt(days) <= 30) interval = 'h6';

    const res = await fetchWithTimeout(
      `https://api.coincap.io/v2/assets/${coinId}/history?interval=${interval}`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const { data } = await res.json();
      const prices: [number, number][] = data.map((item: any) => [
        item.time,
        parseFloat(item.priceUsd),
      ]);
      return { prices, total_volumes: [] };
    }
  } catch {}

  return { prices: [], total_volumes: [] };
}
