import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
import { siteConfig } from "@/config/site";
import { getArticlesByCategorySlug, getCategoryBySlug, getTotalArticlesByCategorySlug } from "@/services/article.service";
import { SidebarArticleCard } from "@/components/articles/SidebarArticleCard";
import { Pagination } from "@/components/layout/Pagination";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
  { params }: CategoryPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: `Categoría no encontrada - ${siteConfig.name}`,
    };
  }

  return {
    title: `Noticias sobre ${category.name} | ${siteConfig.name}`,
    description: `Las últimas noticias y análisis sobre el mundo de ${category.name}. Infórmate de las tendencias clave.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sParams = await searchParams;
  
  const page = typeof sParams.page === "string" ? parseInt(sParams.page, 10) : 1;
  const limit = 12;
  const skip = (page - 1) * limit;

  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const [articles, totalCount] = await Promise.all([
    getArticlesByCategorySlug(slug, limit, skip),
    getTotalArticlesByCategorySlug(slug)
  ]);
  
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-7xl mx-auto w-full px-4 py-8">
        <header className="mb-10 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-4xl font-bold mb-4 text-black dark:text-white">
            Noticias de <span className="text-[color:var(--color-brand)]">{category.name}</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl">
            Explora las noticias, análisis y actualizaciones más recientes sobre <strong>{category.name}</strong>. Nuestro equipo de IA recopila los movimientos del mercado para que no te pierdas ningún detalle clave.
          </p>
        </header>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <SidebarArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 bg-zinc-50 dark:bg-zinc-900 text-center">
            <p className="text-zinc-500 text-lg">Aún no hay noticias en esta categoría.</p>
          </div>
        )}
        
        <Pagination currentPage={page} totalPages={totalPages} basePath={`/categoria/${slug}`} />
      </main>
    </div>
  );
}