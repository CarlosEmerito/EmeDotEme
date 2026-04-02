import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function Home() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: { category: true },
    take: 5,
  });

  const mainArticle = articles[0];
  const sideArticles = articles.slice(1);

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-7xl mx-auto w-full px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-black dark:text-white">Últimas Noticias Cripto</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Article (Hero) */}
          {mainArticle ? (
            <Link href={`/articulo/${mainArticle.slug}`} className="md:col-span-2 group">
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 bg-zinc-50 dark:bg-zinc-900 h-full transition-shadow group-hover:shadow-lg dark:group-hover:border-zinc-700">
                <h2 className="text-3xl font-bold mb-4 text-black dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {mainArticle.title}
                </h2>
                <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 line-clamp-3">
                  {mainArticle.summary}
                </p>
                <div className="flex items-center text-sm text-zinc-500 mt-auto">
                  <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{mainArticle.category.name}</span>
                  <span className="mx-3">•</span>
                  <span>{new Date(mainArticle.createdAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
                  <span className="mx-3">•</span>
                  <span>Por {mainArticle.author}</span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="md:col-span-2 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
              <p className="text-zinc-500">No hay noticias disponibles todavía.</p>
            </div>
          )}

          {/* Sidebar / Secondary Articles */}
          <div className="flex flex-col gap-6">
            {sideArticles.map((article) => (
              <Link href={`/articulo/${article.slug}`} key={article.id} className="group">
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900 transition-shadow group-hover:shadow-md dark:group-hover:border-zinc-700">
                  <h3 className="text-lg font-bold mb-2 text-black dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
                    {article.summary}
                  </p>
                  <div className="flex justify-between items-center mt-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">{article.category.name}</span>
                    <span className="text-xs text-zinc-500">{new Date(article.createdAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
