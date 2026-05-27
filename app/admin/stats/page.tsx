export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { BarChart3, TrendingUp, Hash, FileText, Users, Tag, BarChart } from "lucide-react";

export const metadata = { title: "Estadísticas | Admin" };

export default async function StatsPage() {
  const articles = await prisma.article.findMany({ 
    select: { 
      id: true,
      published: true, 
      categoryId: true, 
      articleTags: {
        select: { name: true }
      }, 
      createdAt: true,
      isOriginal: true
    } 
  });
  const categories = await prisma.category.findMany();
  const subscribers = await prisma.subscriber.count({ where: { active: true } });


  const totalArticles = articles.length;
  const publishedArticles = articles.filter(a => a.published).length;
  const originalArticles = articles.filter(a => a.isOriginal).length;
  
  // Articles by category
  const categoryCounts = categories.map(cat => ({
    name: cat.name,
    count: articles.filter(a => a.categoryId === cat.id).length,
    published: articles.filter(a => a.categoryId === cat.id && a.published).length,
    original: articles.filter(a => a.categoryId === cat.id && a.isOriginal).length
  })).sort((a, b) => b.count - a.count);

  // Tag analysis
  const tagFrequency: Record<string, number> = {};
  articles.forEach(article => {
    article.articleTags.forEach(tag => {
      tagFrequency[tag.name] = (tagFrequency[tag.name] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([tag, count]) => ({ tag, count }));

  // Articles by month (last 6 months)
  const monthlyData: Record<string, number> = {};
  const monthlyPublishedData: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
    monthlyData[monthName] = 0;
    monthlyPublishedData[monthName] = 0;
  }
  
  articles.forEach(article => {
    const monthName = article.createdAt.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
    if (monthlyData[monthName] !== undefined) {
      monthlyData[monthName]++;
      if (article.published) {
        monthlyPublishedData[monthName]++;
      }
    }
  });

  // Daily average (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentArticles = articles.filter(a => a.createdAt > thirtyDaysAgo);
  const articlesPerDay = recentArticles.length / 30;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-black dark:text-white font-serif uppercase tracking-wider">
          Métricas y Estadísticas
        </h1>
        <p className="text-zinc-500 mt-2">
          Visión general del rendimiento del contenido generado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800/30 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 dark:text-blue-400 text-sm font-bold uppercase tracking-wider">Artículos Totales</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-300 mt-2">{totalArticles}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/30">
            <p className="text-blue-700 dark:text-blue-400 text-sm">{publishedArticles} publicados ({Math.round((publishedArticles / totalArticles) * 100) || 0}%)</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800/30 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 dark:text-green-400 text-sm font-bold uppercase tracking-wider">Suscriptores</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-300 mt-2">{subscribers}</p>
            </div>
            <Users className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800/30">
            <p className="text-green-700 dark:text-green-400 text-sm">Activos en newsletter</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800/30 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 dark:text-purple-400 text-sm font-bold uppercase tracking-wider">Originales</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-300 mt-2">{originalArticles}</p>
            </div>
            <BarChart3 className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800/30">
            <p className="text-purple-700 dark:text-purple-400 text-sm">{Math.round((originalArticles / totalArticles) * 100) || 0}% del total</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800/30 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-700 dark:text-amber-400 text-sm font-bold uppercase tracking-wider">Promedio Diario</p>
              <p className="text-3xl font-bold text-amber-900 dark:text-amber-300 mt-2">{articlesPerDay.toFixed(1)}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800/30">
            <p className="text-amber-700 dark:text-amber-400 text-sm">Artículos/día (últimos 30 días)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider flex items-center">
              <BarChart className="w-5 h-5 mr-2" />
              Artículos por Categoría
            </h2>
            <span className="text-sm text-zinc-500">{categories.length} categorías</span>
          </div>
          <div className="space-y-4">
            {categoryCounts.map(cat => (
              <div key={cat.name} className="p-3 border border-zinc-100 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-black dark:text-white">{cat.name}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-zinc-500">{cat.count} total</span>
                    <span className="text-sm text-green-600 dark:text-green-400">{cat.published} publicados</span>
                    {cat.original > 0 && (
                      <span className="text-sm text-purple-600 dark:text-purple-400">{cat.original} originales</span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-2">
                  <div 
                    className="bg-black dark:bg-white h-2 rounded-full" 
                    style={{ width: `${totalArticles > 0 ? (cat.count / totalArticles) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                  <span>{Math.round((cat.count / totalArticles) * 100) || 0}% del total</span>
                  <span>{Math.round((cat.published / cat.count) * 100) || 0}% publicados</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Generación (Últimos 6 Meses)
            </h2>
            <span className="text-sm text-zinc-500">Total: {Object.values(monthlyData).reduce((a, b) => a + b, 0)}</span>
          </div>
          <div className="flex items-end justify-between h-64 gap-2 mt-4">
            {Object.entries(monthlyData).map(([month, count]) => {
              const publishedCount = monthlyPublishedData[month];
              const maxCount = Math.max(...Object.values(monthlyData), 1);
              const height = `${(count / maxCount) * 100}%`;
              const publishedHeight = `${(publishedCount / maxCount) * 100}%`;
              return (
                <div key={month} className="flex flex-col items-center flex-1 gap-2 group">
                  <div className="relative w-full flex justify-center items-end h-full bg-zinc-50 dark:bg-zinc-900/50 rounded-t">
                    <div 
                      className="w-full mx-1 bg-zinc-300 dark:bg-zinc-800 rounded-t transition-all group-hover:opacity-80"
                      style={{ height }}
                    >
                      <div 
                        className="w-full bg-black dark:bg-white rounded-t transition-all"
                        style={{ height: publishedHeight }}
                      ></div>
                    </div>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      <div>Total: {count}</div>
                      <div>Publicados: {publishedCount}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-zinc-500 tracking-wider">
                    {month}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center space-x-4 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-black dark:bg-white mr-2 rounded"></div>
              <span className="text-sm text-zinc-500">Publicados</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-zinc-300 dark:bg-zinc-800 mr-2 rounded"></div>
              <span className="text-sm text-zinc-500">Totales</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider flex items-center">
              <Tag className="w-5 h-5 mr-2" />
              Etiquetas Más Usadas
            </h2>
            <span className="text-sm text-zinc-500">{Object.keys(tagFrequency).length} etiquetas únicas</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {topTags.map(({ tag, count }) => {
              const maxCount = Math.max(...topTags.map(t => t.count), 1);
              const size = 0.5 + (count / maxCount) * 1.5;
              return (
                <div 
                  key={tag}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors group relative"
                  style={{ fontSize: `${size}rem` }}
                >
                  <span className="font-bold text-black dark:text-white">{tag}</span>
                  <span className="absolute -top-2 -right-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
          {topTags.length === 0 && (
            <p className="text-zinc-500 text-center py-8">No hay etiquetas asignadas aún.</p>
          )}
        </div>
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wider flex items-center">
            <Hash className="w-5 h-5 mr-2" />
            Resumen de Datos
          </h2>
          <span className="text-sm text-zinc-500">Actualizado en tiempo real</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border border-zinc-100 dark:border-zinc-800 rounded-lg">
            <h3 className="font-bold text-black dark:text-white mb-2">Distribución Temporal</h3>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex justify-between">
                <span>Artículos hoy:</span>
                <span className="font-bold">{articles.filter(a => {
                  const today = new Date();
                  return a.createdAt.getDate() === today.getDate() && 
                         a.createdAt.getMonth() === today.getMonth() && 
                         a.createdAt.getFullYear() === today.getFullYear();
                }).length}</span>
              </li>
              <li className="flex justify-between">
                <span>Esta semana:</span>
                <span className="font-bold">{articles.filter(a => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return a.createdAt > weekAgo;
                }).length}</span>
              </li>
              <li className="flex justify-between">
                <span>Este mes:</span>
                <span className="font-bold">{articles.filter(a => {
                  const monthAgo = new Date();
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  return a.createdAt > monthAgo;
                }).length}</span>
              </li>
            </ul>
          </div>
          
          <div className="p-4 border border-zinc-100 dark:border-zinc-800 rounded-lg">
            <h3 className="font-bold text-black dark:text-white mb-2">Estado de Publicación</h3>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex justify-between">
                <span>Publicados:</span>
                <span className="font-bold text-green-600 dark:text-green-400">{publishedArticles}</span>
              </li>
              <li className="flex justify-between">
                <span>Ocultos:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{totalArticles - publishedArticles}</span>
              </li>
              <li className="flex justify-between">
                <span>Tasa de publicación:</span>
                <span className="font-bold">{Math.round((publishedArticles / totalArticles) * 100) || 0}%</span>
              </li>
            </ul>
          </div>
          
          <div className="p-4 border border-zinc-100 dark:border-zinc-800 rounded-lg">
            <h3 className="font-bold text-black dark:text-white mb-2">Contenido Original</h3>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex justify-between">
                <span>Artículos originales:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{originalArticles}</span>
              </li>
              <li className="flex justify-between">
                <span>No originales:</span>
                <span className="font-bold">{totalArticles - originalArticles}</span>
              </li>
              <li className="flex justify-between">
                <span>Porcentaje original:</span>
                <span className="font-bold">{Math.round((originalArticles / totalArticles) * 100) || 0}%</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
