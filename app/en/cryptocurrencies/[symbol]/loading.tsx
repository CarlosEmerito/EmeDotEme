export default function CoinDetailLoadingEn() {
  return (
    <main className="min-h-screen bg-white dark:bg-black animate-pulse">
      <div className="border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-48 mb-8" />
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
              <div>
                <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-48 mb-2" />
                <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-72" />
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-40" />
              <div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded-full w-24 mt-2" />
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="aspect-[16/9] md:aspect-[21/9] bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
      </div>
    </main>
  );
}
