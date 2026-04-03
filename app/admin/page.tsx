import { prisma } from "@/lib/prisma";
import ArticleTable from "./components/ArticleTable";

export const metadata = { title: "Admin | EmeDotEme" };

export default async function AdminPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true }
  });

  const publishedCount = articles.filter(a => a.published).length;
  const hiddenCount = articles.length - publishedCount;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
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
              <span className="font-bold text-lg">{articles.length}</span>
              <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold">Total</span>
            </div>
            <div className="bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 px-4 py-2 border border-green-200 dark:border-green-900/30 rounded flex flex-col items-center">
              <span className="font-bold text-lg">{publishedCount}</span>
              <span className="text-xs uppercase tracking-wider font-bold">Públicos</span>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 px-4 py-2 border border-amber-200 dark:border-amber-900/30 rounded flex flex-col items-center">
              <span className="font-bold text-lg">{hiddenCount}</span>
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
      
      <ArticleTable initialArticles={articles} />
    </div>
  );
}