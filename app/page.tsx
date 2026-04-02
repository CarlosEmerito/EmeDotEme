import { getPublishedArticles } from "@/services/article.service";
import { HeroArticleCard } from "@/components/articles/HeroArticleCard";
import { SidebarArticleCard } from "@/components/articles/SidebarArticleCard";

export default async function Home() {
  const articles = await getPublishedArticles(5);

  const mainArticle = articles[0];
  const sideArticles = articles.slice(1);

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-7xl mx-auto w-full px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-black dark:text-white">Últimas Noticias Cripto</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Article (Hero) */}
          {mainArticle ? (
            <HeroArticleCard article={mainArticle} />
          ) : (
            <div className="md:col-span-2 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
              <p className="text-zinc-500">No hay noticias disponibles todavía.</p>
            </div>
          )}

          {/* Sidebar / Secondary Articles */}
          <div className="flex flex-col gap-6">
            {sideArticles.map((article) => (
              <SidebarArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
