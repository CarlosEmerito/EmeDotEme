import { getPublishedArticles, getTotalPublishedArticlesCount } from "@/services/article.service";
import { SidebarArticleCard } from "@/components/articles/SidebarArticleCard";
import Link from "next/link";

export default async function AllArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = typeof params.p === "string" ? parseInt(params.p, 10) : 1;
  const limit = 12;
  const skip = (page - 1) * limit;

  const [articles, totalCount] = await Promise.all([
    getPublishedArticles(limit, skip),
    getTotalPublishedArticlesCount()
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-4xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-bold font-serif mb-8 text-black dark:text-white uppercase tracking-wider">
          Todas las Noticias
        </h1>
        
        {articles.length === 0 ? (
          <p className="text-zinc-500">No hay noticias en esta página.</p>
        ) : (
          <div className="flex flex-col gap-6 mb-12">
            {articles.map((article) => (
              <SidebarArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8 border-t border-zinc-200 dark:border-zinc-800 pt-8">
            {page > 1 ? (
              <Link 
                href={`/noticias?p=${page - 1}`}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-medium rounded transition-colors"
              >
                Anterior
              </Link>
            ) : (
              <span className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 text-sm font-medium rounded cursor-not-allowed">
                Anterior
              </span>
            )}
            
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Página {page} de {totalPages}
            </span>

            {page < totalPages ? (
              <Link 
                href={`/noticias?p=${page + 1}`}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-medium rounded transition-colors"
              >
                Siguiente
              </Link>
            ) : (
              <span className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 text-sm font-medium rounded cursor-not-allowed">
                Siguiente
              </span>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
