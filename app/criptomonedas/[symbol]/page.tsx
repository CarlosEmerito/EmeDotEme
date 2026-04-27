import { getCoinDataBySymbol } from "@/modules/market/market.service";
import { getArticlesByTicker } from "@/modules/articles/article.service";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatRelativeDate } from "@/lib/utils";
import PriceChart from "@/components/market/PriceChart";

interface PricePageProps {
  params: Promise<{ symbol: string }>;
}

export default async function PricePage({ params }: PricePageProps) {
  const { symbol } = await params;
  const coin = await getCoinDataBySymbol(symbol);

  if (!coin) {
    notFound();
  }

  const relatedArticles = await getArticlesByTicker(symbol);

  const isPositive = coin.price_change_percentage_24h >= 0;

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      {/* Header de la Moneda */}
      <div className="border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <nav className="flex items-center text-xs uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-600 mb-8">
            <Link href="/" className="hover:text-[color:var(--color-brand)]">Inicio</Link>
            <span className="mx-3">•</span>
            <Link href="/noticias" className="hover:text-[color:var(--color-brand)]">Criptomonedas</Link>
            <span className="mx-3">•</span>
            <span className="text-zinc-900 dark:text-zinc-100">{coin.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-center gap-6">
              {coin.image && (
                <div className="relative w-20 h-20 bg-white dark:bg-zinc-900 rounded-2xl p-2 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <Image src={coin.image} alt={coin.name} fill className="object-contain p-2" />
                </div>
              )}
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-black dark:text-white font-serif tracking-tighter flex items-center gap-3">
                  {coin.name}
                  <span className="text-xl md:text-2xl text-zinc-400 dark:text-zinc-600 font-sans uppercase font-medium">
                    {coin.symbol}
                  </span>
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                  Precio y estadísticas en tiempo real de {coin.name}.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end">
              <div className="text-5xl font-black text-black dark:text-white tracking-tighter">
                ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </div>
              <div className={`mt-2 flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold border ${
                isPositive 
                  ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50' 
                  : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50'
              }`}>
                {isPositive ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                <span className="opacity-60 font-medium">(24h)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black dark:text-white font-serif italic">Gráfico de precios</h2>
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Datos en Tiempo Real • CoinGecko</span>
        </div>
        <PriceChart coinId={coin.id} coinName={coin.name} isPositive={isPositive} />
      </div>

      {/* Stats Grid */}
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="Market Cap" 
            value={`$${(coin.market_cap || 0).toLocaleString('en-US', { notation: 'compact', compactDisplay: 'short' })}`} 
          />
          <StatCard 
            label="Volumen 24h" 
            value={`$${(coin.total_volume || 0).toLocaleString('en-US', { notation: 'compact', compactDisplay: 'short' })}`} 
          />
          <StatCard 
            label="Suministro" 
            value={`${(coin.circulating_supply || 0).toLocaleString('en-US', { notation: 'compact' })} ${coin.symbol.toUpperCase()}`} 
          />
          <StatCard 
            label="Máximo 24h" 
            value={`$${(coin.high_24h || coin.current_price).toLocaleString()}`} 
          />
        </div>

        {/* Noticias Relacionadas */}
        <div className="mt-24">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-black dark:text-white font-serif">Noticias de {coin.name}</h2>
            <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-900 mx-8"></div>
          </div>

          {relatedArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {relatedArticles.map((article) => (
                <Link href={`/articulo/${article.slug}`} key={article.id} className="group flex flex-col gap-6">
                  {article.imageUrl && (
                    <div className="aspect-[16/9] relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-900 rounded-2xl">
                      <Image 
                        src={article.imageUrl} 
                        alt={article.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest font-black text-[color:var(--color-brand)]">
                      <span>{article.category.name}</span>
                      <span className="text-zinc-300 dark:text-zinc-800">•</span>
                      <span className="text-zinc-400 dark:text-zinc-600 font-bold">{formatRelativeDate(article.createdAt)}</span>
                    </div>
                    <h3 className="text-xl font-bold text-black dark:text-white group-hover:text-[color:var(--color-brand)] transition-colors leading-tight font-serif">
                      {article.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-950/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">Sin noticias recientes de ${coin.symbol.toUpperCase()}.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm">
      <div className="text-xs uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-600 mb-3">{label}</div>
      <div className="text-xl font-black text-black dark:text-white tracking-tight">{value}</div>
    </div>
  );
}
