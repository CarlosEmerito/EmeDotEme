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
    <Link href={`/articulo/${article.slug}`} className="md:col-span-2 group flex flex-col justify-center h-full pb-8 md:pb-0 border-b border-zinc-200 dark:border-zinc-800 md:border-b-0">
      <div className="mb-3">
        <span className="text-brand text-xs font-bold uppercase tracking-widest text-[color:var(--color-brand)]">
          {article.category.name}
        </span>
      </div>
      <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-black dark:text-white group-hover:text-[color:var(--color-brand)] transition-colors leading-tight">
        {article.title}
      </h2>
      <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 line-clamp-3 leading-relaxed">
        {article.summary}
      </p>
      <div className="flex items-center text-xs text-zinc-500 mt-auto uppercase tracking-wide">
        <span>Por <span className="text-zinc-800 dark:text-zinc-300 font-semibold">{article.author}</span></span>
        <span className="mx-2">•</span>
        <span>
          {new Date(article.createdAt).toLocaleDateString("es-ES", {
            month: "short",
            day: "numeric",
            year: "numeric"
          })}
        </span>
      </div>
    </Link>
  );
}