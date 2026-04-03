export default function Loading() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-7xl mx-auto w-full px-4 py-8 animate-pulse">
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-64 mb-8"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Main Article Skeleton */}
          <div className="md:col-span-2 border-b border-zinc-200 dark:border-zinc-800 md:border-b-0 pb-8 md:pb-0">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24 mb-4"></div>
            <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded w-full mb-3"></div>
            <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-6"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full mb-2"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full mb-2"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3 mb-6"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-48 mt-auto"></div>
          </div>

          {/* Sidebar Skeletons */}
          <div className="flex flex-col md:border-l md:border-zinc-200 dark:border-zinc-800 md:pl-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-5 last:border-0 last:pb-0 last:mb-0">
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-20 mb-3"></div>
                <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-full mb-2"></div>
                <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5 mb-3"></div>
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
