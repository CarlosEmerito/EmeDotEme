export default function CriptomonedasLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen animate-pulse">
      <div className="mb-12">
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-64 mb-4" />
        <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-96" />
      </div>
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                {["#", "Activo", "Precio", "24h", "Market Cap", "Volumen"].map((h) => (
                  <th key={h} className="px-6 py-5"><div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-16" /></th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-6" /></td>
                  <td className="px-6 py-5"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full" /><div className="flex flex-col gap-1"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24" /><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-10" /></div></div></td>
                  <td className="px-6 py-5 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20 ml-auto" /></td>
                  <td className="px-6 py-5 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-14 ml-auto" /></td>
                  <td className="px-6 py-5 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16 ml-auto" /></td>
                  <td className="px-6 py-5 text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
