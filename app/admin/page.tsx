import { prisma } from "@/lib/prisma";
import ArticleTable from "./components/ArticleTable";
import Link from "next/link";
import { Eye, FileText, Users, BarChart3, Calendar, TrendingUp } from "lucide-react";

export const metadata = { title: "Admin | EmeDotEme" };

export default async function AdminPage({
  searchParams
}: {
  searchParams?: { search?: string }
}) {
  const allArticles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true }
  });
  
  const searchQuery = searchParams?.search?.toLowerCase() || "";
  const filteredArticles = searchQuery 
    ? allArticles.filter(article => 
        article.title.toLowerCase().includes(searchQuery) ||
        article.summary?.toLowerCase().includes(searchQuery) ||
        article.content.toLowerCase().includes(searchQuery) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery)) ||
        article.category.name.toLowerCase().includes(searchQuery)
      )
    : allArticles;

  const publishedCount = allArticles.filter(a => a.published).length;
  
  const filteredPublishedCount = filteredArticles.filter(a => a.published).length;
  const filteredHiddenCount = filteredArticles.length - filteredPublishedCount;
  
  const categories = await prisma.category.findMany();
  const subscribers = await prisma.subscriber.count({ where: { active: true } });
  
  const recentArticles = filteredArticles.slice(0, 5);
  const originalArticles = allArticles.filter(a => a.isOriginal).length;
  
  const articlesByMonth: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
    articlesByMonth[monthName] = 0;
  }
  
  allArticles.forEach(article => {
    const monthName = article.createdAt.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
    if (articlesByMonth[monthName] !== undefined) {
      articlesByMonth[monthName]++;
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-black dark:text-white font-serif uppercase tracking-wider">
            Dashboard Admin
          </h1>
          <p className="text-zinc-500 mt-2">
            Gestiona los artículos generados automáticamente por la Inteligencia Artificial.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-center">
          <div className="flex space-x-3 text-sm">
            <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded flex flex-col items-center">
               <span className="font-bold text-lg">{filteredArticles.length}</span>
              <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold">Total</span>
            </div>
            <div className="bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 px-4 py-2 border border-green-200 dark:border-green-900/30 rounded flex flex-col items-center">
               <span className="font-bold text-lg">{filteredPublishedCount}</span>
              <span className="text-xs uppercase tracking-wider font-bold">Públicos</span>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 px-4 py-2 border border-amber-200 dark:border-amber-900/30 rounded flex flex-col items-center">
               <span className="font-bold text-lg">{filteredHiddenCount}</span>
              <span className="text-xs uppercase tracking-wider font-bold">Ocultos</span>
            </div>
          </div>
          <a
            href="/admin/create"
            className="bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white font-bold py-2 px-6 rounded transition-colors whitespace-nowrap"
          >
            + Nuevo Artículo
          </a>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800/30 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 dark:text-blue-400 text-sm font-bold uppercase tracking-wider">Artículos Originales</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-300 mt-2">{originalArticles}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/30">
             <p className="text-blue-700 dark:text-blue-400 text-sm">{Math.round((originalArticles / allArticles.length) * 100) || 0}% del total</p>
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
            <Link href="/admin/newsletter" className="text-green-700 dark:text-green-400 text-sm hover:underline">Gestionar suscriptores →</Link>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800/30 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 dark:text-purple-400 text-sm font-bold uppercase tracking-wider">Categorías Activas</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-300 mt-2">{categories.length}</p>
            </div>
            <BarChart3 className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800/30">
            <Link href="/admin/categories" className="text-purple-700 dark:text-purple-400 text-sm hover:underline">Ver todas →</Link>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800/30 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-700 dark:text-amber-400 text-sm font-bold uppercase tracking-wider">Tasa de Publicación</p>
               <p className="text-3xl font-bold text-amber-900 dark:text-amber-300 mt-2">{Math.round((publishedCount / allArticles.length) * 100) || 0}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800/30">
             <p className="text-amber-700 dark:text-amber-400 text-sm">{publishedCount} de {allArticles.length} publicados</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold uppercase tracking-wider">Artículos Recientes</h2>
              <Link href="/admin/stats" className="text-sm text-zinc-500 hover:text-black dark:hover:text-white">Ver estadísticas completas →</Link>
            </div>
            <div className="space-y-4">
              {recentArticles.map(article => (
                <div key={article.id} className="flex items-center justify-between p-4 border border-zinc-100 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-bold text-black dark:text-white line-clamp-1">{article.title}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-zinc-500">{article.category.name}</span>
                      <span className="text-xs text-zinc-500">{article.createdAt.toLocaleDateString('es-ES')}</span>
                      <span className={`text-xs px-2 py-1 rounded ${article.published ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                        {article.published ? 'Publicado' : 'Oculto'}
                      </span>
                    </div>
                  </div>
                  <Link 
                    href={`/admin/edit/${article.id}`}
                    className="ml-4 text-sm text-zinc-500 hover:text-black dark:hover:text-white hover:underline"
                  >
                    Editar →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <h2 className="text-lg font-bold uppercase tracking-wider mb-6">Actividad Reciente</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-sm">Generación de Artículos</p>
                <p className="text-zinc-500 text-sm">Últimos 6 meses</p>
              </div>
            </div>
            
            <div className="pl-11">
              <div className="flex flex-col space-y-2">
                {Object.entries(articlesByMonth).map(([month, count]) => (
                  <div key={month} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">{month}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black dark:bg-white rounded-full" 
                          style={{ width: `${Math.min(count * 20, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded">
                  <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-bold text-sm">Acciones Rápidas</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Link href="/admin/create" className="text-sm bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white px-3 py-1 rounded transition-colors">
                      + Artículo
                    </Link>
                    <Link href="/admin/categories" className="text-sm border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 px-3 py-1 rounded transition-colors">
                      Categorías
                    </Link>
                    <Link href="/admin/newsletter" className="text-sm border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 px-3 py-1 rounded transition-colors">
                      Newsletter
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wider">Todos los Artículos</h2>
           <div className="text-sm text-zinc-500">{filteredArticles.length} artículos totales</div>
        </div>
         <ArticleTable initialArticles={filteredArticles} />
      </div>
    </div>
  );
}