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
