import Link from "next/link";
import Image from "next/image";
import { formatRelativeDate } from "@/lib/utils";

interface HeroArticleCardProps {
  article: {
    slug: string;
    title: string;
    summary: string | null;
    createdAt: Date;
    author: string;
    imageUrl?: string | null;
    category: {
      name: string;
    };
  };
}

export function HeroArticleCard({ article }: HeroArticleCardProps) {
  return (
    <Link href={`/articulo/${article.slug}`} className="md:col-span-2 group flex flex-col h-full pb-8 md:pb-0 border-b border-zinc-200 dark:border-zinc-800 md:border-b-0">
      {article.imageUrl && (
        <div className="w-full aspect-video relative mb-6 overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <Image 
            src={article.imageUrl} 
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 66vw"
            priority
          />
        </div>
      )}
      <div className="flex flex-col flex-1 justify-center">
        <div className="mb-3">
          <span className="text-[color:var(--color-accent)] text-xs font-bold uppercase tracking-widest">
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
            {formatRelativeDate(article.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}