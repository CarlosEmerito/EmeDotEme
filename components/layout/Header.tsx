import Link from "next/link";
import { siteConfig } from "@/config/site";
import { SearchBar } from "@/components/layout/SearchBar";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto flex h-14 items-center px-4 justify-between">
        <div className="flex items-center">
          <Link className="mr-6 flex items-center space-x-2" href="/">
            <span className="hidden font-bold sm:inline-block text-xl text-black dark:text-white">
              {siteConfig.name}
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link className="transition-colors text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400" href="/categoria/mercados">
              Mercados
            </Link>
            <Link className="transition-colors text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400" href="/categoria/tecnologia">
              Tecnología
            </Link>
            <Link className="transition-colors text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400" href="/categoria/web3">
              Web3
            </Link>
          </nav>
        </div>
        <div className="flex items-center flex-1 md:flex-initial justify-end">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}