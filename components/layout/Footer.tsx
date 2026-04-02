import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 md:py-0">
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4">
        <p className="text-center text-sm leading-loose text-zinc-600 dark:text-zinc-400 md:text-left">
          Built by {siteConfig.author}. Datos provistos por CoinGecko.
        </p>
      </div>
    </footer>
  );
}