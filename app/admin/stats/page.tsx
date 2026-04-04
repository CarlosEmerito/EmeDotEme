import { prisma } from "@/lib/prisma";

export const metadata = { title: "Estadísticas | Admin" };

export default async function StatsPage() {
  const articles = await prisma.article.findMany({ select: { published: true, categoryId: true, tags: true, createdAt: true } });
  const categories = await prisma.category.findMany();
  const subscribers = await prisma.subscriber.count({ where: { active: true } });

  const totalArticles = articles.length;
  const publishedArticles = articles.filter(a => a.published).length;
  
  // Articles by category
  const categoryCounts = categories.map(cat => ({
    name: cat.name,
    count: articles.filter(a => a.categoryId === cat.id).length
  })).sort((a, b) => b.count - a.count);

  // Articles by month (last 6 months)
  const monthlyData: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
    monthlyData[monthName] = 0;
  }
  
  articles.forEach(article => {
    const monthName = article.createdAt.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
    if (monthlyData[monthName] !== undefined) {
      monthlyData[monthName]++;
    }
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-black dark:text-white font-serif uppercase tracking-wider">
          Métricas y Estadísticas
        </h1>
        <p className="text-zinc-500 mt-2">
          Visión general del rendimiento del contenido generado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded text-center">
          <h3 className="text-zinc-500 text-sm uppercase tracking-wider font-bold mb-2">Artículos Publicados</h3>
          <p className="text-4xl font-extrabold">{publishedArticles} <span className="text-lg text-zinc-400 font-normal">/ {totalArticles}</span></p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded text-center">
          <h3 className="text-zinc-500 text-sm uppercase tracking-wider font-bold mb-2">Suscriptores Activos</h3>
          <p className="text-4xl font-extrabold">{subscribers}</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded text-center">
          <h3 className="text-zinc-500 text-sm uppercase tracking-wider font-bold mb-2">Total de Categorías</h3>
          <p className="text-4xl font-extrabold">{categories.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded p-6">
          <h2 className="text-lg font-bold uppercase tracking-wider mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            Artículos por Categoría
          </h2>
          <div className="space-y-4">
            {categoryCounts.map(cat => (
              <div key={cat.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold">{cat.name}</span>
                  <span className="text-zinc-500">{cat.count}</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-2">
                  <div 
                    className="bg-black dark:bg-white h-2 rounded-full" 
                    style={{ width: `${totalArticles > 0 ? (cat.count / totalArticles) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded p-6">
          <h2 className="text-lg font-bold uppercase tracking-wider mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            Generación (Últimos 6 Meses)
          </h2>
          <div className="flex items-end justify-between h-48 gap-2 mt-4">
            {Object.entries(monthlyData).map(([month, count]) => {
              const maxCount = Math.max(...Object.values(monthlyData), 1);
              const height = `${(count / maxCount) * 100}%`;
              return (
                <div key={month} className="flex flex-col items-center flex-1 gap-2 group">
                  <div className="relative w-full flex justify-center items-end h-full bg-zinc-50 dark:bg-zinc-900/50 rounded-t">
                    <div 
                      className="w-full mx-1 bg-black dark:bg-white rounded-t transition-all group-hover:opacity-80"
                      style={{ height }}
                    ></div>
                    <span className="absolute -top-6 text-xs font-bold text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {count}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-zinc-500 tracking-wider">
                    {month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
