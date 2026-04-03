import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CreateArticleForm from "../components/CreateArticleForm";

export const metadata = { title: "Crear Noticia | Admin EmeDotEme" };

export default async function CreateArticlePage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <nav className="mb-8">
        <Link href="/admin" className="text-zinc-500 hover:text-[color:var(--color-brand)] font-semibold text-sm uppercase tracking-wider flex items-center">
          &larr; Volver al Panel
        </Link>
      </nav>
      
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-black dark:text-white font-serif uppercase tracking-wider">
          Redactar Nueva Noticia
        </h1>
        <p className="text-zinc-500 mt-2">
          Publica un artículo original. Puedes guardarlo como público para que aparezca al instante.
        </p>
      </div>

      <CreateArticleForm categories={categories} />
    </div>
  );
}
