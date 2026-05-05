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
  Soy Carlos "Emérito" López Lovera, analista y divulgador tecnológico especializado en la intersección entre las finanzas digitales, la inteligencia artificial y la seguridad informática. Con una trayectoria centrada en entender cómo las tecnologías disruptivas transforman nuestra economía y sociedad, mi objetivo en <strong>${siteConfig.name}</strong> es proporcionar claridad en un entorno de cambio constante.
</p>

<h2>Evolución y Enfoque</h2>
<p>
  Lo que comenzó como un espacio dedicado exclusivamente al análisis de los mercados de criptomonedas ha evolucionado hacia una plataforma integral de información tecnológica. Hoy, ${siteConfig.name} cubre cuatro pilares fundamentales que definen el futuro digital:
</p>
<ul>
  <li><strong>Criptomonedas y Mercados:</strong> Análisis técnico y fundamental de activos digitales y tendencias macroeconómicas.</li>
  <li><strong>Inteligencia Artificial:</strong> Seguimiento de los avances en modelos de lenguaje, automatización y el impacto de la IA en el sector empresarial.</li>
  <li><strong>Ciberseguridad:</strong> Divulgación sobre amenazas, vulnerabilidades y estrategias de protección en un mundo cada vez más interconectado.</li>
  <li><strong>Tecnología y Negocios:</strong> El impacto de la innovación en la estrategia corporativa y la economía global.</li>
</ul>

<h2>Nuestra Misión</h2>
<p>
  En la era de la sobreinformación, la calidad del análisis es más valiosa que nunca. En ${siteConfig.name}, no solo reportamos lo que sucede; analizamos <strong>por qué</strong> sucede y qué implicaciones tiene para los inversores, profesionales y entusiastas de la tecnología. Creemos en un periodismo independiente, analítico y respaldado por datos.
</p>

<h2>Compromiso con la Educación</h2>
<p>
  La adopción masiva de tecnologías como la IA o la Blockchain requiere una base sólida de conocimiento. Por ello, cada artículo está diseñado para ser accesible pero profundo, proporcionando las herramientas necesarias para que nuestros lectores tomen decisiones informadas y seguras.
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
