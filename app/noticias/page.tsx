import { getPublishedArticles, getTotalPublishedArticlesCount } from "@/services/article.service";
import { SidebarArticleCard } from "@/components/articles/SidebarArticleCard";
import { Pagination } from "@/components/layout/Pagination";

export default async function AllArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
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

        <Pagination currentPage={page} totalPages={totalPages} basePath="/noticias" />
      </main>
    </div>
  );
}
