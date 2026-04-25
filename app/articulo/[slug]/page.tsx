import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata, ResolvingMetadata } from "next";
import { siteConfig } from "@/config/site";
import { getArticleBySlug, getRelatedArticles } from "@/modules/articles/article.service";
import { SidebarArticleCard } from "@/components/articles/SidebarArticleCard";
import { formatRelativeDate, calculateReadingTime } from "@/lib/utils";
import { ShareButtons } from "@/components/articles/ShareButtons";
import { Comments } from "@/components/articles/Comments";
import { TextToSpeech } from "@/components/articles/TextToSpeech";
import { ArticleSchema } from "@/components/seo/ArticleSchema";

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata(
  { params }: ArticlePageProps,
  _: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: `Artículo no encontrado - ${siteConfig.name}`,
    };
  }

  return {
    title: `${article.title}`, // Ya usará el template global de layout.tsx
    description: article.summary || siteConfig.description,
    authors: [{ name: article.author }],
    alternates: {
      canonical: `/articulo/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.summary || "",
      type: "article",
      publishedTime: article.createdAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
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
        <nav className="flex items-center justify-between text-sm text-zinc-500 mb-8">
          <div className="flex items-center">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Inicio</Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{article.category.name}</span>
          </div>
          
          <div className="flex items-center gap-4">
            {article.titleEn && (
              <Link href={`/en/articulo/${article.slug}`} className="flex items-center gap-1 text-xs font-semibold px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                🇺🇸 Read in English
              </Link>
            )}
          </div>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-black dark:text-white leading-tight font-serif">
            {article.title}
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
            {article.summary}
          </p>
          
          <div className="flex flex-col gap-4 border-t border-b border-zinc-200 dark:border-zinc-800 py-6 mb-10">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] uppercase tracking-widest font-medium text-zinc-500 dark:text-zinc-500">
              <span className="text-[color:var(--color-brand)] font-bold">Por {article.author}</span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span>{formatRelativeDate(article.createdAt)}</span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span>{calculateReadingTime(article.content)} min lectura</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {article.tickers && article.tickers.length > 0 && (
                  <div className="flex items-center gap-2">
                    {article.tickers.map(ticker => (
                      <Link 
                        href={`/mercados/${ticker.toUpperCase()}`}
                        key={ticker} 
                        className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600 hover:text-[color:var(--color-brand)] transition-colors"
                      >
                        ${ticker.toUpperCase()}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 items-center">
                <TextToSpeech text={article.content} title={article.title} lang="es" />
                <ShareButtons title={article.title} slug={article.slug} />
              </div>
            </div>
          </div>

          {article.imageUrl && (
            <figure className="w-full mb-10">
              <div className="aspect-video relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <Image 
                  src={article.imageUrl} 
                  alt={article.imageCaption || `Imagen ilustrativa sobre ${article.title}`}
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

        {/* Key Points */}
        {article.keyPoints && article.keyPoints.length > 0 && (
          <div className="mb-10 p-6 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-black dark:text-white font-serif flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[color:var(--color-brand)]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Puntos Clave
            </h3>
            <ul className="grid grid-cols-1 gap-3">
              {article.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[color:var(--color-brand)] mt-2.5" />
                  <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Content */}
        <article className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </article>

        {/* Glossary Section */}
        {article.glossary && Array.isArray(article.glossary) && article.glossary.length > 0 && (
          <section className="mt-12 p-8 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
            <h3 className="text-xl font-bold mb-6 text-black dark:text-white font-serif flex items-center gap-2">
              <span className="text-2xl">📖</span> Glosario de términos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(article.glossary as any[]).map((item, i) => (
                <div key={i} className="group">
                  <dt className="text-sm font-black uppercase tracking-widest text-[color:var(--color-brand)] mb-1 group-hover:translate-x-1 transition-transform inline-block">
                    {item.term}
                  </dt>
                  <dd className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                    {item.definition}
                  </dd>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQs Section */}
        {article.faqs && Array.isArray(article.faqs) && article.faqs.length > 0 && (
          <section className="mt-12 pt-10 border-t border-zinc-100 dark:border-zinc-800/50">
            <h3 className="text-2xl font-bold mb-8 text-black dark:text-white font-serif flex items-center gap-2">
              <span className="text-2xl">❓</span> Preguntas Frecuentes
            </h3>
            <div className="space-y-4">
              {(article.faqs as any[]).map((faq, i) => (
                <details key={i} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-bold text-zinc-900 dark:text-zinc-100 group-open:bg-zinc-50 dark:group-open:bg-zinc-800/50 transition-colors">
                    <span>{faq.question}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="p-5 text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}


        {/* Footer info (Tags & Sentiment) */}
        <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-8">
          {/* Tags */}
          {article.articleTags && article.articleTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.articleTags.map((tag) => (
                <Link 
                  href={`/tag/${tag.slug}`}
                  key={tag.id} 
                  className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-[color:var(--color-brand)] hover:text-white dark:hover:bg-[color:var(--color-brand)] transition-colors text-xs font-bold uppercase tracking-wider rounded-full"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
          
          {/* Sentiment */}
          {article.sentiment && (
            <div className="flex items-center px-4 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-sm">
               Sentimiento del mercado: <span className="ml-2 font-bold">{article.sentiment}</span>
            </div>
          )}
        </div>

        {/* Schema.org JSON-LD */}
        <ArticleSchema article={article} siteUrl={siteConfig.url} />

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

        {/* Affiliate / Monetization Section - Less prominent */}
        <div className="mt-12 mb-8 p-4 border-t border-zinc-200 dark:border-zinc-800 pt-8 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            <strong className="font-semibold text-zinc-800 dark:text-zinc-300">Apoya nuestro periodismo independiente:</strong> Si decides invertir en criptomonedas, considera usar nuestro enlace de afiliado de Binance. Tú recibes un bono de bienvenida y nosotros una pequeña comisión.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="https://www.binance.com/activity/referral-entry/CPA?ref=CPA_00RIF3NDUA" 
              target="_blank" 
              rel="noopener noreferrer nofollow"
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium text-sm rounded-md transition-colors"
            >
              Registrarse en Binance
            </a>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-3 italic">
            Aviso: Este contenido no es consejo financiero. Haz tu propia investigación antes de invertir.
          </p>
        </div>

        {/* Comments System */}
        <Comments />
      </main>
    </div>
  );
}

// ISR: Revalidate cada 1 hora (3600 segundos)
export const revalidate = 3600;