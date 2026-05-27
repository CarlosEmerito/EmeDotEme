import Image from "next/image";
import { Metadata } from "next";
import Link from "next/link";
import { getMarketData } from "@/modules/market/market.service";

export const metadata: Metadata = {
  title: "Criptomonedas en Tiempo Real | EmeDotEme",
  description: "Precios y datos del mercado de criptomonedas en tiempo real.",
};

export default async function CriptomonedasPage() {
  const coins = await getMarketData(100);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
      <div className="mb-12">
        <h1 className="text-4xl font-black font-serif uppercase tracking-tighter text-black dark:text-white mb-4">
          Criptomonedas
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl text-lg font-medium">
          Cotizaciones en tiempo real, capitalización y volumen de los principales activos digitales.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[10px]">
              <tr>
                <th className="px-6 py-5">#</th>
                <th className="px-6 py-5">Activo</th>
                <th className="px-6 py-5 text-right">Precio</th>
                <th className="px-6 py-5 text-right">24h</th>
                <th className="px-6 py-5 text-right font-serif">Market Cap</th>
                <th className="px-6 py-5 text-right font-serif">Volumen</th>
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
                      <Link href={`/criptomonedas/${coin.symbol.toUpperCase()}`} className="flex items-center">
                        <Image src={coin.image || ''} alt={coin.name} width={32} height={32} unoptimized className="w-8 h-8 mr-4 rounded-full bg-white p-0.5 border border-zinc-100 dark:border-zinc-800" />
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
                    Actualizando datos del mercado...
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
