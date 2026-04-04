import Link from "next/link";
import Image from "next/image";
import { formatRelativeDate } from "@/lib/utils";

interface SidebarArticleCardProps {
  article: {
    id: string;
    slug: string;
    title: string;
    titleEn?: string | null;
    summary: string | null;
    summaryEn?: string | null;
    createdAt: Date;
    imageUrl?: string | null;
    category: {
      name: string;
    };
  };
  lang?: "es" | "en";
}

export function SidebarArticleCard({ article, lang = "es" }: SidebarArticleCardProps) {
  const isEn = lang === "en";
  const href = isEn ? `/en/articulo/${article.slug}` : `/articulo/${article.slug}`;
  const displayTitle = isEn && article.titleEn ? article.titleEn : article.title;

  return (
    <Link href={href} className="group flex flex-col sm:flex-row gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-5 last:border-0 last:pb-0 last:mb-0">
      <div className="flex-1 flex flex-col justify-center order-2 sm:order-1">
        <div className="mb-2">
          <span className="text-[color:var(--color-accent)] text-[10px] font-bold uppercase tracking-widest">
            {article.category.name}
          </span>
        </div>
        <h3 className="text-xl font-serif font-bold mb-2 text-black dark:text-white group-hover:text-[color:var(--color-brand)] transition-colors line-clamp-3 leading-snug">
          {displayTitle}
        </h3>
        <div className="text-xs text-zinc-500 uppercase tracking-wide mt-auto pt-2">
          {formatRelativeDate(article.createdAt)}
        </div>
      </div>
      
      {article.imageUrl && (
        <div className="w-full sm:w-28 h-40 sm:h-28 relative flex-shrink-0 order-1 sm:order-2 overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <Image 
            src={article.imageUrl} 
            alt={displayTitle}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 112px"
          />
        </div>
      )}
    </Link>
  );
}