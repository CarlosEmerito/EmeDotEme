import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mercados en Tiempo Real | EmeDotEme",
  description: "Precios y datos del mercado de criptomonedas en tiempo real.",
};

async function getMarketData() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false",
      { next: { revalidate: 60 } } // Revalidate every 60 seconds
    );

    if (!res.ok) {
      throw new Error("Failed to fetch market data");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching market data:", error);
    return [];
  }
}

export default async function MercadosPage() {
  const coins = await getMarketData();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
      <div className="mb-12">
        <h1 className="text-4xl font-black font-serif uppercase tracking-tighter text-black dark:text-white mb-4">
          Mercados
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl text-lg">
          Precios en tiempo real, capitalización de mercado y volumen de las principales criptomonedas.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Moneda</th>
                <th className="px-6 py-4 text-right">Precio</th>
                <th className="px-6 py-4 text-right">24h %</th>
                <th className="px-6 py-4 text-right">Cap. de Mercado</th>
                <th className="px-6 py-4 text-right">Volumen (24h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {coins.length > 0 ? (
                coins.map((coin: any, index: number) => (
                  <tr key={coin.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img src={coin.image} alt={coin.name} className="w-6 h-6 mr-3 rounded-full" />
                        <div>
                          <div className="font-bold text-black dark:text-white">{coin.name}</div>
                          <div className="text-xs text-zinc-500 uppercase">{coin.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-black dark:text-white">
                      ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${coin.price_change_percentage_24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-600 dark:text-zinc-300">
                      ${coin.market_cap.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-600 dark:text-zinc-300">
                      ${coin.total_volume.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    No se pudieron cargar los datos del mercado. Por favor, intenta de nuevo más tarde.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-6 text-xs text-zinc-500 text-center">
        Datos proporcionados por <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer" className="hover:underline text-[color:var(--color-brand)]">CoinGecko</a>
      </div>
    </div>
  );
}
