import React from 'react';
import { getMarketData } from '@/services/market.service';

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