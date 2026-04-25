export const dynamic = "force-dynamic";
import { Metadata, ResolvingMetadata } from "next";
import { siteConfig } from "@/config/site";
import { prisma } from "@/lib/prisma";
import { SidebarArticleCard } from "@/components/articles/SidebarArticleCard";
import { Pagination } from "@/components/layout/Pagination";

interface TagPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
  { params }: TagPageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Noticias sobre #${slug} | ${siteConfig.name}`,
    description: `Descubre las últimas noticias y análisis en profundidad sobre #${slug}. Mantente informado sobre los cambios clave en el ecosistema cripto.`,
  };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const sParams = await searchParams;

  const page = typeof sParams.page === "string" ? parseInt(sParams.page, 10) : 1;
  const limit = 12;

  const decodedTag = decodeURIComponent(slug);

  const skip = (page - 1) * limit;

  const [paginatedArticles, totalCount] = await Promise.all([
    prisma.article.findMany({
      where: {
        published: true,
        articleTags: {
          some: { slug: decodedTag.toLowerCase() }
        }
      },
      include: { category: true, articleTags: true },
      orderBy: [
        { isPinned: 'desc' },
        { priority: 'desc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit,
    }),
    prisma.article.count({
      where: {
        published: true,
        articleTags: {
          some: { slug: decodedTag.toLowerCase() }
        }
      }
    })
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-7xl mx-auto w-full px-4 py-8">
        <header className="mb-10 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-4xl font-bold mb-4 text-black dark:text-white">
            Explorando <span className="text-[color:var(--color-brand)]">#{decodedTag}</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl">
            Todo lo que necesitas saber sobre <strong>{decodedTag}</strong>. Lee nuestras noticias más recientes y análisis técnicos para entender su impacto en el mercado de las criptomonedas.
          </p>
        </header>

        {paginatedArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedArticles.map((article) => (
              <SidebarArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 bg-zinc-50 dark:bg-zinc-900 text-center">
            <p className="text-zinc-500 text-lg">Aún no hay noticias con esta etiqueta.</p>
          </div>
        )}
        
        <Pagination currentPage={page} totalPages={totalPages} basePath={`/tag/${slug}`} />
      </main>
    </div>
  );
}