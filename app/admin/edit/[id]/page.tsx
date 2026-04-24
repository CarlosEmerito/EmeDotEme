import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import EditArticleForm from "../../components/EditArticleForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Editar Noticia | Admin EmeDotEme" };

export default async function EditArticlePage({ params }: PageProps) {
  const { id } = await params;
  
  const article = await prisma.article.findUnique({
    where: { id },
    include: { articleTags: true }
  });

  if (!article) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <nav className="mb-8">
        <Link href="/admin" className="text-zinc-500 hover:text-[color:var(--color-brand)] font-semibold text-sm uppercase tracking-wider flex items-center">
          &larr; Volver al Panel
        </Link>
      </nav>
      
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-black dark:text-white font-serif uppercase tracking-wider">
          Editar Noticia
        </h1>
        <p className="text-zinc-500 mt-2">
          Estás modificando el artículo: <strong className="text-black dark:text-white">{article.title}</strong>
        </p>
      </div>

      <EditArticleForm article={article} />
    </div>
  );
}