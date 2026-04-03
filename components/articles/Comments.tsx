"use client";

import Giscus from "@giscus/react";
import { useEffect, useState } from "react";

export function Comments() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO as `${string}/${string}`;
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

  if (!repo || !repoId || !category || !categoryId) {
    return (
      <div className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800 text-center">
        <p className="text-zinc-500 text-sm">
          ⚠️ Los comentarios de Giscus no están configurados. Por favor, añade las variables de entorno NEXT_PUBLIC_GISCUS_*.
        </p>
      </div>
    );
  }

  return (
    <section className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800">
      <h2 className="text-2xl font-bold mb-6 text-black dark:text-white font-serif">
        Comentarios
      </h2>
      <div className="w-full bg-transparent">
        <Giscus
          id="comments"
          repo={repo}
          repoId={repoId}
          category={category}
          categoryId={categoryId}
          mapping="pathname"
          term="Welcome to @giscus/react component!"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="top"
          theme="preferred_color_scheme"
          lang="es"
          loading="lazy"
        />
      </div>
    </section>
  );
}
