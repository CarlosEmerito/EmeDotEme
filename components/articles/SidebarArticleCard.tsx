import Link from "next/link";

interface SidebarArticleCardProps {
  article: {
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    createdAt: Date;
    category: {
      name: string;
    };
  };
}

export function SidebarArticleCard({ article }: SidebarArticleCardProps) {
  return (
    <Link href={`/articulo/${article.slug}`} className="group">
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900 transition-shadow group-hover:shadow-md dark:group-hover:border-zinc-700">
        <h3 className="text-lg font-bold mb-2 text-black dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
          {article.summary}
        </p>
        <div className="flex justify-between items-center mt-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">
            {article.category.name}
          </span>
          <span className="text-xs text-zinc-500">
            {new Date(article.createdAt).toLocaleDateString("es-ES", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}