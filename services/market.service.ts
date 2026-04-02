export type Coin = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
};

/**
 * Obtiene los datos del mercado en vivo desde CoinGecko (Top 15 monedas).
 * Se utiliza caché automático de Next.js para evitar abusar del rate limit.
 */
export async function getMarketData(): Promise<Coin[]> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=false',
      { next: { revalidate: 60 } } // Refresh every 60 seconds
    );
    
    if (!res.ok) {
      throw new Error('Failed to fetch market data');
    }
    
    return res.json();
  } catch (error) {
    console.error("Error fetching market data:", error);
    return [];
  }
}