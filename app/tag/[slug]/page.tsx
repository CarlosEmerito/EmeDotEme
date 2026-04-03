import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
import { siteConfig } from "@/config/site";
import { prisma } from "@/lib/prisma";
import { SidebarArticleCard } from "@/components/articles/SidebarArticleCard";

interface TagPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata(
  { params }: TagPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  
  return {
    title: `Noticias sobre #${slug} | ${siteConfig.name}`,
    description: `Las últimas noticias y análisis sobre #${slug} en ${siteConfig.name}`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;

  // Decodificar el slug (ej. mercado-cripto -> mercado cripto)
  const decodedTag = decodeURIComponent(slug);

  // Buscar artículos que contengan este tag (case insensitive en PostgreSQL)
  // Usamos has para el array de strings o ILIKE si lo queremos más flexible,
  // pero Prisma soporta buscar en arrays con `hasSome` o similar
  
  // Como Prisma no tiene ILIKE para arrays primitivos fácilmente sin query raw,
  // buscaremos aquellos donde el array de tags contenga el string exacto,
  // o podemos traer todos los publicados y filtrarlos en memoria si no son muchos.
  // Para optimización lo mejor sería usar `has` pero respeta mayúsculas.
  // Lo haremos trayendo los artículos y filtrando en JS por ahora para ignorar case.
  
  const allArticles = await prisma.article.findMany({
    where: { published: true },
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  });

  const articles = allArticles.filter(article => 
    article.tags.some(t => t.toLowerCase() === decodedTag.toLowerCase())
  );

  if (articles.length === 0) {
    // No notFound, solo mostrar vacío
  }

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-7xl mx-auto w-full px-4 py-8">
        <header className="mb-10 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-4xl font-bold mb-4 text-black dark:text-white">
            Explorando <span className="text-[color:var(--color-brand)]">#{decodedTag}</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Artículos y noticias etiquetadas con {decodedTag}.
          </p>
        </header>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <SidebarArticleCard key={article.id} article={article as any} />
            ))}
          </div>
        ) : (
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 bg-zinc-50 dark:bg-zinc-900 text-center">
            <p className="text-zinc-500 text-lg">Aún no hay noticias con esta etiqueta.</p>
          </div>
        )}
      </main>
    </div>
  );
}