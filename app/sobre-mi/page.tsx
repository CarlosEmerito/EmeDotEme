import Image from "next/image";
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
  Soy Carlos "Emérito" López Lovera, analista y divulgador tecnológico especializado en la intersección entre las finanzas digitales, la inteligencia artificial y la seguridad informática. Mi objetivo en <strong>${siteConfig.name}</strong> es proporcionar análisis profundos y claridad estratégica en un entorno tecnológico de cambio constante.
</p>

<h2>Especialización y Cobertura</h2>
<p>
  ${siteConfig.name} es una plataforma integral de información técnica centrada en los cuatro pilares que definen la economía digital contemporánea:
</p>
<ul>
  <li><strong>Inteligencia Artificial:</strong> Seguimiento de los avances en modelos de lenguaje, automatización y el impacto transformador de la IA en el ecosistema empresarial.</li>
  <li><strong>Ciberseguridad:</strong> Divulgación técnica sobre amenazas, vulnerabilidades y estrategias de protección en infraestructuras digitales.</li>
  <li><strong>Criptomonedas y Mercados:</strong> Análisis técnico y fundamental de activos digitales, protocolos blockchain y tendencias macroeconómicas globales.</li>
  <li><strong>Tecnología y Negocios:</strong> Análisis de la innovación tecnológica como motor de la estrategia corporativa y el crecimiento económico.</li>
</ul>

<h2>Nuestra Misión</h2>
<p>
  En la era de la sobreinformación, la calidad del análisis es el activo más valioso. En ${siteConfig.name}, no nos limitamos a reportar hechos; desglosamos <strong>por qué</strong> ocurren y evaluamos sus implicaciones para inversores, profesionales y tomadores de decisiones. Nuestro compromiso es con un periodismo independiente, analítico y estrictamente respaldado por datos.
</p>

<h2>Compromiso con la Educación</h2>
<p>
  La adopción de tecnologías críticas como la IA o la Blockchain requiere una base sólida de conocimiento técnico. Por ello, cada artículo está diseñado para ser accesible pero riguroso, proporcionando las herramientas necesarias para que nuestros lectores naveguen el futuro digital de forma informada y segura.
</p>`;

  const content = setting?.value || defaultContent;

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-3xl mx-auto w-full px-4 py-12">
        <header className="mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-zinc-200 dark:bg-zinc-800 flex flex-shrink-0 overflow-hidden relative border border-zinc-200 dark:border-zinc-800">
              <Image 
                src="/EmeDotEme.jpg" 
                alt="Carlos Emérito López Lovera"
                width={128}
                height={128}
                unoptimized
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
