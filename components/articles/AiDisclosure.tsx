import Link from "next/link";

/**
 * Aviso de contenido generado con IA.
 *
 * Obligación legal, no cortesía: el artículo 50.4 del Reglamento de IA
 * (Reglamento (UE) 2024/1689) obliga a los responsables del despliegue a
 * divulgar que un texto ha sido generado por IA cuando se publica para informar
 * al público sobre asuntos de interés público. La excepción es que haya revisión
 * humana o control editorial con una persona responsable identificada.
 *
 * La etiqueta es visible y va acompañada de metadatos legibles por máquina, tal
 * como recomiendan las directrices de la Comisión Europea y de la AESIA.
 *
 * @param lang Idioma de la página ("es" o "en")
 * @param reviewed Si el artículo ha pasado revisión humana. Con `true`, el aviso
 *   cambia de redacción: sigue siendo necesario etiquetar la generación, pero se
 *   indica además que hay revisión.
 */
export function AiDisclosure({ lang = "es", reviewed = false }: { lang?: "es" | "en"; reviewed?: boolean }) {
  const es = lang === "es";

  return (
    <aside
      aria-label={es ? "Aviso sobre el uso de inteligencia artificial" : "AI disclosure"}
      className="mb-8 px-4 py-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg flex items-start gap-3"
    >
      <span aria-hidden="true" className="text-base leading-6">🤖</span>
      <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
          {es ? "Contenido generado con inteligencia artificial." : "AI-generated content."}
        </strong>{" "}
        {es ? (
          <>
            Este artículo se redacta con un sistema automático a partir de fuentes
            periodísticas publicadas, que se citan y enlazan al final del texto.
            {reviewed
              ? " Ha sido revisado por la redacción antes de publicarse."
              : " Se publica mediante un proceso automatizado, sin revisión previa."}{" "}
            <Link href="/politica-editorial" className="underline hover:text-[color:var(--color-brand)]">
              Política editorial
            </Link>
            .
          </>
        ) : (
          <>
            This article is written by an automated system from published news
            sources, which are cited and linked at the end of the text.
            {reviewed
              ? " It was reviewed by our editorial team before publication."
              : " It is published through an automated process, without prior review."}{" "}
            <Link href="/en/editorial-policy" className="underline hover:text-[color:var(--color-brand)]">
              Editorial policy
            </Link>
            .
          </>
        )}
      </p>
    </aside>
  );
}

/**
 * Bloque de atribución a las fuentes originales.
 *
 * El hiperenlace a la publicación original está expresamente excluido del
 * derecho de los editores de prensa (art. 129 bis.6 TRLPI) y es la práctica
 * correcta en cualquier caso: quien quiera leer la noticia completa va al medio
 * que la publicó.
 */
export function SourceAttribution({
  sourceUrl,
  lang = "es",
}: {
  sourceUrl?: string | null;
  lang?: "es" | "en";
}) {
  const es = lang === "es";
  if (!sourceUrl) return null;

  let host = "";
  try {
    host = new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }

  return (
    <aside className="mt-10 pt-6 border-t border-zinc-200 dark:border-zinc-800">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {es ? "Información basada en la cobertura original de" : "Based on original reporting by"}{" "}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="font-medium text-[color:var(--color-brand)] hover:underline"
        >
          {host}
        </a>
        . {es ? "Consulta la noticia completa en su medio." : "Read the full story at the source."}
      </p>
    </aside>
  );
}
