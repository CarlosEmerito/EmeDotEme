import Link from "next/link";

interface HeroArticleCardProps {
  article: {
    slug: string;
    title: string;
    summary: string | null;
    createdAt: Date;
    author: string;
    category: {
      name: string;
    };
  };
}

export function HeroArticleCard({ article }: HeroArticleCardProps) {
  return (
    <Link href={`/articulo/${article.slug}`} className="md:col-span-2 group">
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 bg-zinc-50 dark:bg-zinc-900 h-full transition-shadow group-hover:shadow-lg dark:group-hover:border-zinc-700">
        <h2 className="text-3xl font-bold mb-4 text-black dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {article.title}
        </h2>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 line-clamp-3">
          {article.summary}
        </p>
        <div className="flex items-center text-sm text-zinc-500 mt-auto">
          <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            {article.category.name}
          </span>
          <span className="mx-3">•</span>
          <span>
            {new Date(article.createdAt).toLocaleDateString("es-ES", {
              month: "short",
              day: "numeric",
            })}
          </span>
          <span className="mx-3">•</span>
          <span>Por {article.author}</span>
        </div>
      </div>
    </Link>
  );
}