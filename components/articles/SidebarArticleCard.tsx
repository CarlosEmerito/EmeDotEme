import Link from "next/link";
import { formatRelativeDate } from "@/lib/utils";

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
    <Link href={`/articulo/${article.slug}`} className="group block border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-5 last:border-0 last:pb-0 last:mb-0">
      <div className="mb-2">
        <span className="text-[color:var(--color-accent)] text-[10px] font-bold uppercase tracking-widest">
          {article.category.name}
        </span>
      </div>
      <h3 className="text-xl font-serif font-bold mb-2 text-black dark:text-white group-hover:text-[color:var(--color-brand)] transition-colors line-clamp-3 leading-snug">
        {article.title}
      </h3>
      {article.summary && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
          {article.summary}
        </p>
      )}
      <div className="text-xs text-zinc-500 uppercase tracking-wide">
        {formatRelativeDate(article.createdAt)}
      </div>
    </Link>
  );
}