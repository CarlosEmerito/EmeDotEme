import React from 'react';

type Coin = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
};

async function getMarketData(): Promise<Coin[]> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=false',
      { next: { revalidate: 60 } } // Refresh every 60 seconds
    );
    if (!res.ok) {
      throw new Error('Failed to fetch data');
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching market data:", error);
    return [];
  }
}

export default async function MarketTicker() {
  const coins = await getMarketData();

  if (!coins || coins.length === 0) {
    return null; // Don't render ticker if API fails
  }

  return (
    <div className="w-full bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center h-10 text-sm">
      <div className="flex animate-marquee whitespace-nowrap min-w-max">
        {/* We map twice to create a seamless infinite loop effect */}
        {[...coins, ...coins].map((coin, i) => (
          <div key={`${coin.id}-${i}`} className="flex items-center mx-6">
            <span className="font-bold text-zinc-800 dark:text-zinc-200 mr-2">
              {coin.symbol.toUpperCase()}
            </span>
            <span className="mr-2 font-mono text-zinc-900 dark:text-zinc-100">
              ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </span>
            <span
              className={`font-semibold ${
                coin.price_change_percentage_24h >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {coin.price_change_percentage_24h > 0 ? '+' : ''}
              {coin.price_change_percentage_24h?.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}