"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MarketCoin {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}

let globalCache: { data: MarketCoin[]; ts: number } | null = null;
const CACHE_TTL = 60_000;

export default function MarketTicker() {
  const [coins, setCoins] = useState<MarketCoin[]>(() => {
    if (globalCache && Date.now() - globalCache.ts < CACHE_TTL) {
      return globalCache.data;
    }
    return [];
  });
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const lang = pathname?.startsWith("/en") ? "en" : "es";
  const prefix = lang === "en" ? "/en" : "";
  const isCryptoPage = pathname?.includes("/criptomonedas") || pathname?.includes("/cryptocurrencies");

  useEffect(() => {
    pathRef.current = pathname;
    let mounted = true;

    async function fetchData() {
      if (globalCache && Date.now() - globalCache.ts < CACHE_TTL) {
        if (mounted) setCoins(globalCache.data);
        return;
      }
      try {
        const res = await fetch('/api/market-data');
        if (res.ok) {
          const data = await res.json();
          globalCache = { data, ts: Date.now() };
          if (mounted) setCoins(data);
        }
      } catch {}
    }

    fetchData();

    const interval = setInterval(fetchData, isCryptoPage ? 30_000 : 120_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isCryptoPage, pathname]);

  if (!coins || coins.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center h-10 text-sm group">
      <div className="flex animate-marquee whitespace-nowrap min-w-max group-hover:[animation-play-state:paused]">
        {coins.map((coin, i) => (
          <Link 
            href={`${prefix}/criptomonedas/${coin.symbol.toUpperCase()}`}
            key={`${coin.id}-original-${i}`} 
            className="flex items-center mx-6 hover:text-[color:var(--color-brand)] transition-colors"
          >
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
          </Link>
        ))}
        {coins.map((coin, i) => (
          <Link 
            href={`${prefix}/criptomonedas/${coin.symbol.toUpperCase()}`}
            key={`${coin.id}-duplicate-${i}`} 
            className="flex items-center mx-6 hover:text-[color:var(--color-brand)] transition-colors" 
            aria-hidden="true"
          >
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
          </Link>
        ))}
      </div>
    </div>
  );
}
