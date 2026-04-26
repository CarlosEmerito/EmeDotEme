"use client";

import React, { useEffect, useRef } from "react";

interface TradingViewChartProps {
  symbol: string;
}

export default function TradingViewChart({ symbol }: TradingViewChartProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clean up previous widget if any
    container.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    // Format symbol for TradingView (usually BINANCE:SYMBOLUSDT for crypto)
    const tvSymbol = `BINANCE:${symbol.toUpperCase()}USDT`;

    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": tvSymbol,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "3",
      "locale": "es",
      "enable_publishing": false,
      "hide_top_toolbar": true,
      "hide_legend": false,
      "save_image": false,
      "calendar": false,
      "hide_volume": true,
      "support_host": "https://www.tradingview.com"
    });

    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-zinc-50 dark:bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-900 shadow-inner">
      <div 
        ref={container} 
        className="tradingview-widget-container h-full w-full"
      />
    </div>
  );
}
