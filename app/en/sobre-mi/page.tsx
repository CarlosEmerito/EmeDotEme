import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: `About the Author | ${siteConfig.name}`,
  description: `Meet Carlos &quot;Emérito&quot; López Lovera, lead analyst at EmeDotEme.`,
};

export default async function AboutPageEn() {
  const setting = await prisma.setting.findUnique({
    where: { key: "sobre_mi_content_en" }
  });

  const defaultContent = `<p>
  I am Carlos "Emérito" López Lovera, a financial journalist and market analyst specializing in cryptocurrencies, business technology, artificial intelligence, and cybersecurity. With years of experience covering digital markets, my goal is to demystify the blockchain ecosystem and provide clear, actionable analysis.
</p>

<h2>Our Mission at ${siteConfig.name}</h2>
<p>
  I founded ${siteConfig.name} with a clear vision: to deliver timely financial news, free of noise and backed by hard real-time market data. In an ecosystem that moves 24/7, the speed and accuracy of information are crucial for making sound decisions.
</p>

<h2>Trajectory</h2>
<p>
  Throughout my career, I have collaborated on various editorial projects, always seeking the intersection between traditional finance and the new technological frontier. I firmly believe that the adoption of cryptocurrencies, AI, and cybersecurity requires quality education and honest journalism.
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
                Lead Analyst & Founder
              </p>
            </div>
          </div>
        </header>

        <article 
          className="prose prose-zinc dark:prose-invert prose-lg max-w-none prose-a:text-[color:var(--color-brand)] prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        <div className="not-prose mt-8 p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
          <h3 className="text-xl font-bold font-serif mb-4 text-black dark:text-white">Connect with me</h3>
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
