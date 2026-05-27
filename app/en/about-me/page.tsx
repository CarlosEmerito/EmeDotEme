import Image from "next/image";
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
  I am Carlos "Emérito" López Lovera, a technical analyst and technology advocate specializing in the intersection of digital finance, artificial intelligence, and information security. My goal at <strong>${siteConfig.name}</strong> is to provide deep analysis and strategic clarity in a constantly changing technological environment.
</p>

<h2>Specialization and Coverage</h2>
<p>
  ${siteConfig.name} is a comprehensive technical information platform focused on the four pillars defining the contemporary digital economy:
</p>
<ul>
  <li><strong>Artificial Intelligence:</strong> Monitoring advances in language models, automation, and the transformative impact of AI on the business ecosystem.</li>
  <li><strong>Cybersecurity:</strong> Technical disclosure on threats, vulnerabilities, and protection strategies in digital infrastructures.</li>
  <li><strong>Cryptocurrencies and Markets:</strong> Technical and fundamental analysis of digital assets, blockchain protocols, and global macroeconomic trends.</li>
  <li><strong>Technology and Business:</strong> Analysis of technological innovation as a driver of corporate strategy and economic growth.</li>
</ul>

<h2>Our Mission</h2>
<p>
  In the age of information overload, the quality of analysis is the most valuable asset. At ${siteConfig.name}, we don't just report facts; we break down <strong>why</strong> they happen and evaluate their implications for investors, professionals, and decision-makers. Our commitment is to independent, analytical journalism strictly backed by data.
</p>

<h2>Commitment to Education</h2>
<p>
  The adoption of critical technologies such as AI or Blockchain requires a solid foundation of technical knowledge. Therefore, each article is designed to be accessible yet rigorous, providing the necessary tools for our readers to navigate the digital future in an informed and secure manner.
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
