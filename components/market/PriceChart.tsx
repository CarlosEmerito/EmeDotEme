"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

interface PriceChartProps {
  coinId: string;
  coinName: string;
  isPositive: boolean;
}

const TIME_RANGES = [
  { label: "1D", value: "1" },
  { label: "7D", value: "7" },
  { label: "14D", value: "14" },
  { label: "1M", value: "30" },
  { label: "3M", value: "90" },
  { label: "6M", value: "180" },
  { label: "1Y", value: "365" },
];

export default function PriceChart({ coinId, coinName, isPositive: initialIsPositive }: PriceChartProps) {
  const pathname = usePathname();
  const lang = pathname?.startsWith("/en") ? "en" : "es";

  const [data, setData] = useState<{ time: string; fullTime: string; price: number; volume: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [days, setDays] = useState("7");
  const [isPositive, setIsPositive] = useState(initialIsPositive);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/market-data?coinId=${coinId}&days=${days}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const rawData: { prices: [number, number][], total_volumes: [number, number][] } = await res.json();
        
        if (rawData.prices.length > 1) {
          const firstPrice = rawData.prices[0][1];
          const lastPrice = rawData.prices[rawData.prices.length - 1][1];
          setIsPositive(lastPrice >= firstPrice);
        }

        const formattedData = rawData.prices.map(([timestamp, price], index) => {
          const date = new Date(timestamp);
          
          return {
            timestamp,
            time: date.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", {
              month: "short",
              day: "numeric",
            }),
            fullTime: date.toLocaleString(lang === "en" ? "en-US" : "es-ES", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            }),
            price,
            volume: rawData.total_volumes[index] ? rawData.total_volumes[index][1] : 0,
          };
        });
        
        setData(formattedData);
      } catch (err) {
        console.error("Error loading chart data:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [coinId, days, lang]);

  const chartColor = isPositive ? "#10b981" : "#ef4444"; // emerald-500 or red-500

  const formatXAxis = (tickItem: number) => {
    const date = new Date(tickItem);
    if (days === "1") {
      return date.toLocaleTimeString(lang === "en" ? "en-US" : "es-ES", {
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    return date.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", {
      month: "short",
      day: "numeric",
    });
  };

  const t = {
    es: {
      loading: "Cargando gráfico...",
      noData: `No hay datos históricos disponibles para ${coinName}.`,
      noDataDesc: "Es posible que este activo sea muy reciente o no tenga liquidez suficiente en CoinGecko.",
      volume: "Volumen",
      price: "Precio"
    },
    en: {
      loading: "Loading chart...",
      noData: `No historical data available for ${coinName}.`,
      noDataDesc: "This asset might be too new or lack sufficient liquidity on CoinGecko.",
      volume: "Volume",
      price: "Price"
    }
  }[lang];

  return (
    <div className="flex flex-col w-full gap-4">
      {/* Time Range Selector */}
      <div className="flex flex-wrap items-center justify-start md:justify-end gap-2">
        {TIME_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => setDays(range.value)}
            disabled={isLoading}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              days === range.value
                ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            } disabled:opacity-50`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Chart Area */}
      <div className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-zinc-50 dark:bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-900 shadow-inner p-4">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-zinc-300 border-t-[color:var(--color-brand)] rounded-full animate-spin"></div>
              <p className="text-sm text-zinc-500 font-medium">{t.loading}</p>
            </div>
          </div>
        )}

        {!isLoading && (error || data.length === 0) ? (
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="text-center">
              <p className="text-zinc-500 font-medium mb-2">{t.noData}</p>
              <p className="text-xs text-zinc-400">{t.noDataDesc}</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.1} />
              <XAxis 
                dataKey="timestamp" 
                hide={false} 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#888888" }}
                minTickGap={60}
                tickFormatter={formatXAxis}
              />
              {/* Y Axis for Price */}
              <YAxis 
                yAxisId="left"
                hide={true} 
                domain={["auto", "auto"]} 
              />
              {/* Y Axis for Volume */}
              <YAxis 
                yAxisId="right"
                hide={true} 
                domain={[0, (dataMax: number) => dataMax * 4]} 
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const price = payload.find(p => p.dataKey === 'price')?.value;
                    const volume = payload.find(p => p.dataKey === 'volume')?.value;
                    return (
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-xl min-w-[150px]">
                        <p className="text-xs text-zinc-500 mb-2 font-bold">{payload[0].payload.fullTime}</p>
                        <div className="flex justify-between items-center gap-4 mb-1">
                          <span className="text-[10px] uppercase font-bold text-zinc-400">{t.price}:</span>
                          <span className="text-sm font-black text-black dark:text-white">
                            ${(price as number)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                          <span className="text-[10px] uppercase font-bold text-zinc-400">{t.volume}:</span>
                          <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                            ${(volume as number)?.toLocaleString('en-US', { notation: 'compact' })}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPrice)"
                animationDuration={500}
                isAnimationActive={!isLoading}
              />
              <Bar
                yAxisId="right"
                dataKey="volume"
                fill={chartColor}
                opacity={0.15}
                radius={[2, 2, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
