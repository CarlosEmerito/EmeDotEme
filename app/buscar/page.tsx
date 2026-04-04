import { Metadata } from "next";
import { searchArticles } from "@/services/article.service";
import { SidebarArticleCard } from "@/components/articles/SidebarArticleCard";

export const metadata: Metadata = {
  title: "Buscar Noticias | EmeDotEme",
  description: "Búsqueda de noticias sobre criptomonedas y web3",
};

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

type ArticleWithCategory = Awaited<ReturnType<typeof searchArticles>>;

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  
  let articles: ArticleWithCategory = [];
  if (q.trim()) {
    articles = await searchArticles(q.trim());
  }

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-7xl mx-auto w-full px-4 py-8">
        <header className="mb-10 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-white">
            Resultados de búsqueda
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {q ? (
              <>Mostrando resultados para: <span className="font-semibold text-black dark:text-white">&quot;{q}&quot;</span></>
            ) : (
              "Introduce un término en la barra de búsqueda superior."
            )}
          </p>
        </header>

        {q ? (
          articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <SidebarArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 bg-zinc-50 dark:bg-zinc-900 text-center">
              <p className="text-zinc-500 text-lg mb-2">No se encontraron resultados para &quot;{q}&quot;.</p>
              <p className="text-sm text-zinc-400">Intenta buscar con otros términos o palabras clave.</p>
            </div>
          )
        ) : null}
      </main>
    </div>
  );
}