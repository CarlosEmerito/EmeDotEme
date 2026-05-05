import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Real-Time Cryptocurrencies | EmeDotEme",
  description: "Real-time cryptocurrency prices and market data.",
};

async function getMarketData(): Promise<Array<{
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
}>> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false",
      { next: { revalidate: 60 } }
    );
    if (res.ok) return await res.json();
  } catch {}

  try {
    const fallbackRes = await fetch("https://api.coincap.io/v2/assets?limit=100", {
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
        total_volume: parseFloat(coin.volumeUsd24Hr)
      }));
    }
  } catch {}
  return [];
}

export default async function CriptomonedasPageEn() {
  const coins = await getMarketData();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
      <div className="mb-12">
        <h1 className="text-4xl font-black font-serif uppercase tracking-tighter text-black dark:text-white mb-4">
          Cryptocurrencies
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl text-lg font-medium">
          Real-time quotes, market cap, and volume of the top digital assets.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[10px]">
              <tr>
                <th className="px-6 py-5">#</th>
                <th className="px-6 py-5">Asset</th>
                <th className="px-6 py-5 text-right">Price</th>
                <th className="px-6 py-5 text-right">24h</th>
                <th className="px-6 py-5 text-right font-serif">Market Cap</th>
                <th className="px-6 py-5 text-right font-serif">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {coins.length > 0 ? (
                coins.map((coin, index: number) => (
                  <tr key={coin.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors group">
                    <td className="px-6 py-5 text-zinc-400 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-6 py-5">
                      <Link href={`/en/cryptocurrencies/${coin.symbol.toUpperCase()}`} className="flex items-center">
                        <img src={coin.image} alt={coin.name} className="w-8 h-8 mr-4 rounded-full bg-white p-0.5 border border-zinc-100 dark:border-zinc-800" />
                        <div>
                          <div className="font-bold text-black dark:text-white group-hover:text-[color:var(--color-brand)] transition-colors">{coin.name}</div>
                          <div className="text-[10px] text-zinc-500 uppercase font-black tracking-tighter">{coin.symbol}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-black dark:text-white">
                      ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </td>
                    <td className={`px-6 py-5 text-right font-bold ${coin.price_change_percentage_24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {coin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h)?.toFixed(2)}%
                    </td>
                    <td className="px-6 py-5 text-right text-zinc-600 dark:text-zinc-400 font-medium">
                      ${coin.market_cap?.toLocaleString('en-US', { notation: 'compact' })}
                    </td>
                    <td className="px-6 py-5 text-right text-zinc-600 dark:text-zinc-400 font-medium">
                      ${coin.total_volume?.toLocaleString('en-US', { notation: 'compact' })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 font-medium italic">
                    Updating market data...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-8 text-[10px] uppercase tracking-widest text-zinc-400 text-center font-bold">
        Powered by <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[color:var(--color-brand)] transition-colors">CoinGecko</a>
      </div>
    </div>
  );
}