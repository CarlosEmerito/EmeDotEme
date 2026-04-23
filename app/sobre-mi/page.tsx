import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: `Sobre el Autor | ${siteConfig.name}`,
  description: `Conoce a Carlos &quot;Emérito&quot; López Lovera, analista principal de EmeDotEme.`,
};

export default async function AboutPage() {
  const setting = await prisma.setting.findUnique({
    where: { key: "sobre_mi_content" }
  });

  const defaultContent = `<p>
  Soy Carlos "Emérito" López Lovera, periodista financiero y analista de mercados especializado en criptomonedas, tecnología empresarial, inteligencia artificial y ciberseguridad. Con años de experiencia cubriendo los mercados digitales, mi objetivo es desmitificar el ecosistema blockchain y proporcionar análisis claros y accionables.
</p>

<h2>Nuestra Misión en ${siteConfig.name}</h2>
<p>
  Fundé ${siteConfig.name} con una visión clara: entregar noticias financieras oportunas, libres de ruido y respaldadas por datos duros del mercado en tiempo real. En un ecosistema que se mueve 24/7, la velocidad y la precisión de la información son cruciales para tomar buenas decisiones.
</p>

<h2>Trayectoria</h2>
<p>
  A lo largo de mi carrera he colaborado en diversos proyectos editoriales, siempre buscando la intersección entre las finanzas tradicionales y la nueva frontera tecnológica. Creo firmemente que la adopción de las criptomonedas, la IA y la ciberseguridad requieren educación de calidad y periodismo honesto.
</p>`;

  const content = setting?.value || defaultContent;

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-3xl mx-auto w-full px-4 py-12">
        <header className="mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-zinc-200 dark:bg-zinc-800 flex flex-shrink-0 overflow-hidden relative border border-zinc-200 dark:border-zinc-800">
              <img 
                src="/EmeDotEme.jpg" 
                alt="Carlos Emérito López Lovera" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-black dark:text-white font-serif mb-2">
                Carlos &quot;Emérito&quot; López Lovera
              </h1>
              <p className="text-lg text-[color:var(--color-brand)] font-medium">
                Analista Principal & Fundador
              </p>
            </div>
          </div>
        </header>

        <article 
          className="prose prose-zinc dark:prose-invert prose-lg max-w-none prose-a:text-[color:var(--color-brand)] prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        <div className="not-prose mt-8 p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
          <h3 className="text-xl font-bold font-serif mb-4 text-black dark:text-white">Conecta conmigo</h3>
          <div className="flex flex-wrap gap-4">
            <a 
              href={siteConfig.links.bluesky}
              target="_blank"
              rel="noreferrer"
              className="text-[color:var(--color-brand)] hover:underline font-medium"
            >
              Bluesky
            </a>
            <span className="text-zinc-400 hidden sm:inline">•</span>
            <a 
              href={siteConfig.links.binanceSquare}
              target="_blank"
              rel="noreferrer"
              className="text-[color:var(--color-brand)] hover:underline font-medium"
            >
              Binance Square
            </a>
            <span className="text-zinc-400 hidden sm:inline">•</span>
            <a 
              href={siteConfig.links.linkedin}
              target="_blank"
              rel="noreferrer"
              className="text-[color:var(--color-brand)] hover:underline font-medium"
            >
              LinkedIn
            </a>
            <span className="text-zinc-400 hidden sm:inline">•</span>
            <a 
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noreferrer"
              className="text-[color:var(--color-brand)] hover:underline font-medium"
            >
              X / Twitter
            </a>
            <span className="text-zinc-400 hidden sm:inline">•</span>
            <a 
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className="text-[color:var(--color-brand)] hover:underline font-medium"
            >
              GitHub
            </a>
            <span className="text-zinc-400 hidden sm:inline">•</span>
            <a 
              href={siteConfig.links.email}
              className="text-[color:var(--color-brand)] hover:underline font-medium"
            >
              Email
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
