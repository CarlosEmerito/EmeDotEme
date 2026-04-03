"use client";

import Giscus from "@giscus/react";
import { useEffect, useState } from "react";

export function Comments() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <section className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800">
      <h2 className="text-2xl font-bold mb-6 text-black dark:text-white font-serif">
        Comentarios
      </h2>
      <div className="w-full bg-transparent">
        <Giscus
          id="comments"
          repo="CarlosEmerito/EmeDotEme"
          repoId="R_kgDOR4WS-w"
          category="General"
          categoryId="DIC_kwDOR4WS-84C59nl"
          mapping="pathname"
          strict="0"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="bottom"
          theme="preferred_color_scheme"
          lang="es"
          loading="lazy"
        />
      </div>
    </section>
  );
}
