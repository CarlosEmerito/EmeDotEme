import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata, ResolvingMetadata } from "next";

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
  const article = await prisma.article.findUnique({
    where: { slug },
  });

  if (!article) {
    return {
      title: "Artículo no encontrado - EmeDotEme",
    };
  }

  return {
    title: `${article.title} | EmeDotEme`,
    description: article.summary || "Lee las últimas noticias sobre criptomonedas en EmeDotEme.",
    openGraph: {
      title: article.title,
      description: article.summary || "",
      type: "article",
      publishedTime: article.createdAt.toISOString(),
      authors: [article.author],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary || "",
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;

  const article = await prisma.article.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!article) {
    notFound();
  }

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-4xl mx-auto w-full px-4 py-12">
        {/* Breadcrumb */}
        <nav className="flex text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Inicio</Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{article.category.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-black dark:text-white leading-tight">
            {article.title}
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
            {article.summary}
          </p>
          <div className="flex items-center justify-between border-t border-b border-zinc-200 dark:border-zinc-800 py-4">
            <div className="flex items-center text-sm text-zinc-700 dark:text-zinc-300">
              <span className="font-semibold text-blue-600 dark:text-blue-400 mr-4">Por {article.author}</span>
              <span>{new Date(article.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <article className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </article>
      </main>
    </div>
  );
}