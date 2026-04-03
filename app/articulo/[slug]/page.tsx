import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata, ResolvingMetadata } from "next";
import { siteConfig } from "@/config/site";
import { getArticleBySlug, getRelatedArticles } from "@/services/article.service";
import { SidebarArticleCard } from "@/components/articles/SidebarArticleCard";
import { formatRelativeDate, calculateReadingTime } from "@/lib/utils";
import { ShareButtons } from "@/components/articles/ShareButtons";
import { Comments } from "@/components/articles/Comments";

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata(
  { params }: ArticlePageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: `Artículo no encontrado - ${siteConfig.name}`,
    };
  }

  return {
    title: `${article.title} | ${siteConfig.name}`,
    description: article.summary || siteConfig.description,
    openGraph: {
      title: article.title,
      description: article.summary || "",
      type: "article",
      publishedTime: article.createdAt.toISOString(),
      authors: [article.author],
      siteName: siteConfig.name,
      images: article.imageUrl ? [{ url: article.imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary || "",
      images: article.imageUrl ? [article.imageUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;

  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(article.categoryId, article.id, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": [article.imageUrl],
    "datePublished": article.createdAt.toISOString(),
    "dateModified": article.updatedAt.toISOString(),
    "author": [{
        "@type": "Person",
        "name": article.author,
        "url": `${siteConfig.url}/sobre-mi`
      }],
    "publisher": {
      "@type": "Organization",
      "name": siteConfig.name,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteConfig.url}/logo.png`
      }
    },
    "description": article.summary
  };

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="flex flex-col max-w-4xl mx-auto w-full px-4 py-12">
        {/* Breadcrumb */}
        <nav className="flex text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Inicio</Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{article.category.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-black dark:text-white leading-tight font-serif">
            {article.title}
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
            {article.summary}
          </p>
          
          <div className="flex items-center justify-between border-t border-b border-zinc-200 dark:border-zinc-800 py-4 mb-8">
            <div className="flex items-center text-sm text-zinc-700 dark:text-zinc-300 flex-wrap gap-y-2">
              <span className="font-semibold text-[color:var(--color-brand)] mr-4">Por {article.author}</span>
              <span>{formatRelativeDate(article.createdAt)}</span>
              <span className="mx-3 text-zinc-300 dark:text-zinc-700 hidden sm:inline">•</span>
              <span>{calculateReadingTime(article.content)} min de lectura</span>
            </div>
            
            <div className="flex gap-2">
              <ShareButtons title={article.title} slug={article.slug} />
            </div>
          </div>

          {article.imageUrl && (
            <figure className="w-full mb-10">
              <div className="aspect-video relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <Image 
                  src={article.imageUrl} 
                  alt={article.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 896px"
                  priority
                />
              </div>
              {article.imageCaption && (
                <figcaption className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 italic text-center border-b border-zinc-100 dark:border-zinc-800/50 pb-4">
                  {article.imageCaption}
                </figcaption>
              )}
            </figure>
          )}
        </header>

        {/* Content */}
        <article className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800">
            <h2 className="text-2xl font-bold mb-6 text-black dark:text-white font-serif">Artículos relacionados</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <SidebarArticleCard key={related.id} article={related} />
              ))}
            </div>
          </section>
        )}

        {/* Comments System */}
        <Comments />
      </main>
    </div>
  );
}