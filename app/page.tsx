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
        <div className="border-b-[3px] border-[color:var(--color-accent)] mb-8 inline-block w-max pb-1">
          <h1 className="text-3xl font-serif font-bold text-black dark:text-white uppercase tracking-wider">
            Últimas Noticias Cripto
          </h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Main Article (Hero) */}
          {mainArticle ? (
            <HeroArticleCard article={mainArticle} />
          ) : (
            <div className="md:col-span-2 flex items-center justify-center p-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <p className="text-zinc-500 font-serif italic text-lg">No hay noticias disponibles todavía.</p>
            </div>
          )}

          {/* Sidebar / Secondary Articles */}
          <div className="flex flex-col md:border-l md:border-zinc-200 dark:border-zinc-800 md:pl-8">
            {sideArticles.map((article) => (
              <SidebarArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
