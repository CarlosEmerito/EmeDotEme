import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { sanitizeArticleHtml } from "@/lib/sanitize-html";
import { calculateReadingTime } from "@/lib/utils";
import { SourceAttribution } from "@/components/articles/SourceAttribution";

/**
 * Enlace privado de revisión.
 *
 * `/preview/<reviewToken>`: la única forma de leer un borrador antes de
 * publicarlo. El token es aleatorio de 128 bits y solo viaja al Telegram de
 * Emérito, así que quien tenga el enlace es él. Nunca se indexa: ni en el
 * sitemap, ni en robots.txt, ni en los metadatos (`noindex`).
 *
 * Esta página no es la del artículo: no tiene el diseño público, no lleva
 * anuncios ni comentarios, y deja claro en pantalla que es un borrador.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Borrador · revisión privada",
  robots: { index: false, follow: false, nocache: true },
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente de tu decisión",
  approved: "Aprobado y publicado",
  rejected: "Descartado",
  hermes_review: "EmeDotHermes lo está revisando",
};

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!/^[0-9a-f]{32}$/.test(token)) {
    notFound();
  }

  const article = await prisma.article.findUnique({
    where: { reviewToken: token },
    include: { category: true, articleTags: true },
  });

  if (!article) {
    return (
      <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
        <main className="max-w-2xl mx-auto w-full px-4 py-20">
          <h1 className="text-2xl font-bold font-serif text-black dark:text-white mb-3">
            Enlace no válido
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Este enlace privado no corresponde a ningún borrador. Puede que el artículo se haya
            borrado o que el enlace esté mal copiado.
          </p>
        </main>
      </div>
    );
  }

  const status = STATUS_LABEL[article.reviewStatus] || article.reviewStatus;

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-3xl mx-auto w-full px-4 py-12">
        <aside className="mb-8 px-4 py-3 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
          <p className="text-[13px] leading-relaxed text-amber-900 dark:text-amber-200">
            <strong className="font-semibold">Borrador · revisión privada.</strong> {status}. Esta
            página no es la del artículo y no está indexada: solo se llega con el enlace privado.
          </p>
        </aside>

        <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-black dark:text-white leading-tight font-serif">
          {article.title}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">{article.summary}</p>

        <p className="text-[13px] uppercase tracking-widest font-medium text-zinc-500 mb-8">
          {article.author} · {article.category?.name} ·{" "}
          {calculateReadingTime(article.content)} min lectura · {status}
        </p>

        {article.imageUrl && (
          <figure className="w-full mb-8">
            <div className="aspect-video relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <Image
                src={article.imageUrl}
                alt={article.imageCaption || `Imagen sobre ${article.title}`}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
            {article.imageCaption && (
              <figcaption className="mt-3 text-sm text-zinc-500 italic text-center">
                {article.imageCaption}
              </figcaption>
            )}
          </figure>
        )}

        {article.keyPoints && article.keyPoints.length > 0 && (
          <section className="mb-8 p-5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <h2 className="text-base font-bold mb-3 text-black dark:text-white">Puntos clave</h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-700 dark:text-zinc-300">
              {article.keyPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </section>
        )}

        <article className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.content) }} />
        </article>

        <SourceAttribution sourceUrl={article.sourceUrl} lang="es" />

        {article.articleTags && article.articleTags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {article.articleTags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-full"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
