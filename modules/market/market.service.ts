// Módulo de mercado: obtiene datos de criptomonedas desde CoinGecko o CoinCap
export type Coin = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
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
  } catch (error) {
    // Ignoramos el error de CoinGecko silenciosamente para intentar el respaldo
  }
  // Respaldo usando CoinCap
  try {
    const fallbackRes = await fetch('https://api.coincap.io/v2/assets?limit=15', {
      next: { revalidate: 60 }
    });
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      return data.data.map((coin: { id: string; symbol: string; name: string; priceUsd: string; changePercent24Hr: string }) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        current_price: parseFloat(coin.priceUsd),
        price_change_percentage_24h: parseFloat(coin.changePercent24Hr)
      }));
    }
  } catch (error) {
    // Falla también el respaldo
  }
  console.warn("⚠️ [Advertencia] No se pudieron obtener los precios en vivo (Rate limit). El bot generará la noticia sin el contexto de precios exactos.");
  return [];
}
