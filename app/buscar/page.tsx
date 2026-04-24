import { Metadata } from "next";
import { searchArticles, type SearchOptions } from "@/modules/articles/article.service";
import { SidebarArticleCard } from "@/components/articles/SidebarArticleCard";
import { SearchFilters } from "@/components/search/SearchFilters";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Buscar Noticias | EmeDotEme",
  description: "Búsqueda de noticias sobre criptomonedas y web3",
};

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  
  // Parse search parameters
  const q = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";
  const tags = typeof params.tags === "string" ? params.tags.split(",").filter(t => t) : [];
  const sentiment = typeof params.sentiment === "string" ? params.sentiment : "";
  const sortBy = typeof params.sort === "string" ? params.sort as 'relevance' | 'newest' | 'oldest' : 'newest';
  const page = typeof params.page === "string" ? parseInt(params.page) || 1 : 1;
  
  // Date parsing
  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;
  if (typeof params.dateFrom === "string") {
    dateFrom = new Date(params.dateFrom);
  }
  if (typeof params.dateTo === "string") {
    dateTo = new Date(params.dateTo);
  }
  
  // Prepare search options
  const searchOptions: SearchOptions = {
    query: q,
    language: 'es',
    categorySlug: category,
    tags,
    sentiment,
    dateFrom,
    dateTo,
    sortBy,
    page,
    limit: 12,
  };
  
  // Execute search
  const searchResult = await searchArticles(searchOptions);
  
  // Get categories and tags for filters
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { articles: { where: { published: true } } }
      }
    }
  });

  // Get unique sentiments
  const sentimentOptions = [
    'Positivo 🐂',
    'Negativo 🐻', 
    'Neutral ⚖️',
    'Especulativo 🤔',
    'Técnico 📊'
  ];
  
  // Extract popular tags from articles
  const allTags = new Set<string>();
  searchResult.articles.forEach(article => {
    article.articleTags?.forEach(tag => allTags.add(tag.name));
  });
  const popularTags = Array.from(allTags).slice(0, 20);

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-7xl mx-auto w-full px-4 py-8">
        <header className="mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-white">
            Búsqueda Avanzada
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {q ? (
              <>Mostrando resultados para: <span className="font-semibold text-black dark:text-white">&quot;{q}&quot;</span></>
            ) : (
              "Busca noticias sobre criptomonedas, blockchain y web3"
            )}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <SearchFilters
              categories={categories}
              popularTags={popularTags}
              sentimentOptions={sentimentOptions}
              currentFilters={{
                query: q,
                category,
                tags,
                sentiment,
                dateFrom: dateFrom?.toISOString().split('T')[0],
                dateTo: dateTo?.toISOString().split('T')[0],
                sort: sortBy
              }}
              language="es"
            />
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-black dark:text-white">
                  {searchResult.total > 0 ? (
                    <>
                      {searchResult.total} resultado{searchResult.total !== 1 ? 's' : ''} encontrado{searchResult.total !== 1 ? 's' : ''}
                    </>
                  ) : (
                    "No se encontraron resultados"
                  )}
                </h2>
                {q && (
                  <p className="text-sm text-zinc-500 mt-1">
                    Búsqueda: &quot;{q}&quot;
                  </p>
                )}
              </div>
              
              {searchResult.total > 0 && (
                <div className="text-sm text-zinc-500">
                  Página {searchResult.page} de {searchResult.totalPages}
                </div>
              )}
            </div>

            {/* Results Grid */}
            {searchResult.total > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {searchResult.articles.map((article) => (
                    <SidebarArticleCard key={article.id} article={article} lang="es" />
                  ))}
                </div>

                {/* Pagination */}
                {searchResult.totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                    {searchResult.page > 1 && (
                      <a
                        href={`/buscar?${new URLSearchParams({
                          ...(q && { q }),
                          ...(category && { category }),
                          ...(tags.length > 0 && { tags: tags.join(',') }),
                          ...(sentiment && { sentiment }),
                          ...(dateFrom && { dateFrom: dateFrom.toISOString().split('T')[0] }),
                          ...(dateTo && { dateTo: dateTo.toISOString().split('T')[0] }),
                          sort: sortBy,
                          page: (searchResult.page - 1).toString()
                        }).toString()}`}
                        className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                      >
                        ← Anterior
                      </a>
                    )}
                    
                    <span className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                      Página {searchResult.page} de {searchResult.totalPages}
                    </span>
                    
                    {searchResult.hasMore && (
                      <a
                        href={`/buscar?${new URLSearchParams({
                          ...(q && { q }),
                          ...(category && { category }),
                          ...(tags.length > 0 && { tags: tags.join(',') }),
                          ...(sentiment && { sentiment }),
                          ...(dateFrom && { dateFrom: dateFrom.toISOString().split('T')[0] }),
                          ...(dateTo && { dateTo: dateTo.toISOString().split('T')[0] }),
                          sort: sortBy,
                          page: (searchResult.page + 1).toString()
                        }).toString()}`}
                        className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                      >
                        Siguiente →
                      </a>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 bg-zinc-50 dark:bg-zinc-900 text-center">
                <p className="text-zinc-500 text-lg mb-2">
                  {q ? `No se encontraron resultados para "${q}"` : "No hay resultados para mostrar"}
                </p>
                <p className="text-sm text-zinc-400 mb-4">
                  {q ? "Intenta buscar con otros términos, eliminar filtros o ampliar la búsqueda." : "Introduce un término de búsqueda o ajusta los filtros."}
                </p>
                {q && (
                  <div className="mt-6">
                    <a 
                      href="/buscar"
                      className="inline-block px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-medium rounded hover:opacity-90 transition-opacity"
                    >
                      Limpiar búsqueda
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Search Tips */}
            {searchResult.total === 0 && q && (
              <div className="mt-8 p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h3 className="font-bold text-blue-800 dark:text-blue-400 mb-2">Consejos de búsqueda:</h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Intenta usar términos más generales o sinónimos</li>
                  <li>• Verifica la ortografía de las palabras clave</li>
                  <li>• Prueba a buscar por categoría o etiqueta específica</li>
                  <li>• Elimina algunos filtros para ampliar los resultados</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}