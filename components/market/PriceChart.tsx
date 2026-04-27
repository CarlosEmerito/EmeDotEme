"use client";

import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PriceChartProps {
  coinId: string;
  coinName: string;
  isPositive: boolean;
}

export default function PriceChart({ coinId, coinName, isPositive }: PriceChartProps) {
  const [data, setData] = useState<{ time: string; price: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/market-data?coinId=${coinId}&days=7`);
        if (!res.ok) throw new Error("Failed to fetch");
        const rawData: [number, number][] = await res.json();
        
        const formattedData = rawData.map(([timestamp, price]) => ({
          time: new Date(timestamp).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          price,
        }));
        
        setData(formattedData);
      } catch (err) {
        console.error("Error loading chart data:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [coinId]);

  if (isLoading) {
    return (
      <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-zinc-300 border-t-[color:var(--color-brand)] rounded-full animate-spin"></div>
          <p className="text-sm text-zinc-500 font-medium">Cargando gráfico...</p>
        </div>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
        <div className="text-center px-6">
          <p className="text-zinc-500 font-medium mb-2">No hay datos históricos disponibles para {coinName}.</p>
          <p className="text-xs text-zinc-400">Es posible que este activo sea muy reciente o no tenga liquidez suficiente en CoinGecko.</p>
        </div>
      </div>
    );
  }

  const chartColor = isPositive ? "#10b981" : "#ef4444"; // emerald-500 or red-500

  return (
    <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-zinc-50 dark:bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-900 shadow-inner p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.1} />
          <XAxis 
            dataKey="time" 
            hide={false} 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#888888" }}
            minTickGap={30}
          />
          <YAxis 
            hide={true} 
            domain={["auto", "auto"]} 
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-xl">
                    <p className="text-xs text-zinc-500 mb-1">{payload[0].payload.time}</p>
                    <p className="text-sm font-bold text-black dark:text-white">
                      ${payload[0].value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={chartColor}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorPrice)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
