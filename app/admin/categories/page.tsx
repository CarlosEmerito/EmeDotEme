import { prisma } from "@/lib/prisma";
import CategoryList from "./components/CategoryList";
import TagList from "./components/TagList";

export const metadata = { title: "Categorías y Etiquetas | Admin" };

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } }
  });

  // Get unique tags from all articles
  const articles = await prisma.article.findMany({ select: { tags: true } });
  const tagCounts: Record<string, number> = {};
  
  articles.forEach(article => {
    article.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const tags = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-black dark:text-white font-serif uppercase tracking-wider">
          Categorías y Etiquetas
        </h1>
        <p className="text-zinc-500 mt-2">
          Gestiona la taxonomía de tus artículos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            Categorías
          </h2>
          <CategoryList initialCategories={categories} />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            Etiquetas ({tags.length})
          </h2>
          <TagList initialTags={tags} />
        </div>
      </div>
    </div>
  );
}
