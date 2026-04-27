import { Metadata } from "next";
import { searchArticles, type SearchOptions } from "@/modules/articles/article.service";
import { SidebarArticleCard } from "@/components/articles/SidebarArticleCard";
import { SearchFilters } from "@/components/search/SearchFilters";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Search News | EmeDotEme",
  description: "Search for cryptocurrency, blockchain and web3 news",
};

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPageEn({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  
  // Parse search parameters
  const q = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";
  const tags = typeof params.tags === "string" ? params.tags.split(",").filter(t => t) : [];
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
    language: 'en',
    categorySlug: category,
    tags,
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
            Advanced Search
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {q ? (
              <>Showing results for: <span className="font-semibold text-black dark:text-white">&quot;{q}&quot;</span></>
            ) : (
              "Search for cryptocurrency, blockchain and web3 news"
            )}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <SearchFilters
              categories={categories}
              popularTags={popularTags}
              currentFilters={{
                query: q,
                category,
                tags,
                dateFrom: dateFrom?.toISOString().split('T')[0],
                dateTo: dateTo?.toISOString().split('T')[0],
                sort: sortBy
              }}
              language="en"
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
                      {searchResult.total} result{searchResult.total !== 1 ? 's' : ''} found
                    </>
                  ) : (
                    "No results found"
                  )}
                </h2>
                {q && (
                  <p className="text-sm text-zinc-500 mt-1">
                    Search: &quot;{q}&quot;
                  </p>
                )}
              </div>
              
              {searchResult.total > 0 && (
                <div className="text-sm text-zinc-500">
                  Page {searchResult.page} of {searchResult.totalPages}
                </div>
              )}
            </div>

            {/* Results Grid */}
            {searchResult.total > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {searchResult.articles.map((article) => (
                    <SidebarArticleCard key={article.id} article={article} lang="en" />
                  ))}
                </div>

                {/* Pagination */}
                {searchResult.totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                    {searchResult.page > 1 && (
                      <a
                        href={`/en/buscar?${new URLSearchParams({
                          ...(q && { q }),
                          ...(category && { category }),
                          ...(tags.length > 0 && { tags: tags.join(',') }),
                          ...(dateFrom && { dateFrom: dateFrom.toISOString().split('T')[0] }),
                          ...(dateTo && { dateTo: dateTo.toISOString().split('T')[0] }),
                          sort: sortBy,
                          page: (searchResult.page - 1).toString()
                        }).toString()}`}
                        className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                      >
                        ← Previous
                      </a>
                    )}
                    
                    <span className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                      Page {searchResult.page} of {searchResult.totalPages}
                    </span>
                    
                    {searchResult.hasMore && (
                      <a
                        href={`/en/buscar?${new URLSearchParams({
                          ...(q && { q }),
                          ...(category && { category }),
                          ...(tags.length > 0 && { tags: tags.join(',') }),
                          ...(dateFrom && { dateFrom: dateFrom.toISOString().split('T')[0] }),
                          ...(dateTo && { dateTo: dateTo.toISOString().split('T')[0] }),
                          sort: sortBy,
                          page: (searchResult.page + 1).toString()
                        }).toString()}`}
                        className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                      >
                        Next →
                      </a>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 bg-zinc-50 dark:bg-zinc-900 text-center">
                <p className="text-zinc-500 text-lg mb-2">
                  {q ? `No results found for "${q}"` : "No results to display"}
                </p>
                <p className="text-sm text-zinc-400 mb-4">
                  {q ? "Try searching with other terms, removing filters, or expanding your search." : "Enter a search term or adjust the filters."}
                </p>
                {q && (
                  <div className="mt-6">
                    <a 
                      href="/en/buscar"
                      className="inline-block px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-medium rounded hover:opacity-90 transition-opacity"
                    >
                      Clear search
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Search Tips */}
            {searchResult.total === 0 && q && (
              <div className="mt-8 p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h3 className="font-bold text-blue-800 dark:text-blue-400 mb-2">Search tips:</h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Try using more general terms or synonyms</li>
                  <li>• Check the spelling of keywords</li>
                  <li>• Try searching by specific category or tag</li>
                  <li>• Remove some filters to expand results</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}