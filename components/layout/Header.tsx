"use client";

import { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { SearchBar } from "@/components/layout/SearchBar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto flex h-14 items-center px-4 justify-between relative">
        <div className="flex items-center">
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden mr-4 p-2 text-zinc-600 dark:text-zinc-400 hover:text-[color:var(--color-brand)] transition-colors focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <Link className="mr-6 flex items-center space-x-2" href="/">
            <span className="font-bold inline-block text-xl text-black dark:text-white font-serif">
              {siteConfig.name}
            </span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link className="transition-colors text-zinc-600 dark:text-zinc-400 hover:text-[color:var(--color-brand)] uppercase tracking-wider text-xs font-bold" href="/categoria/criptomonedas">
              Criptomonedas
            </Link>
            <Link className="transition-colors text-zinc-600 dark:text-zinc-400 hover:text-[color:var(--color-brand)] uppercase tracking-wider text-xs font-bold" href="/categoria/empresa">
              Empresa
            </Link>

            <Link className="transition-colors text-zinc-600 dark:text-zinc-400 hover:text-[color:var(--color-brand)] uppercase tracking-wider text-xs font-bold" href="/categoria/ia">
              IA
            </Link>
            <Link className="transition-colors text-zinc-600 dark:text-zinc-400 hover:text-[color:var(--color-brand)] uppercase tracking-wider text-xs font-bold" href="/categoria/ciberseguridad">
              Ciberseguridad
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4 flex-1 md:flex-initial justify-end">
          <SearchBar />
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 w-full bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 shadow-lg px-4 py-6 flex flex-col space-y-4">
          <Link 
            className="transition-colors text-zinc-800 dark:text-zinc-200 hover:text-[color:var(--color-brand)] text-lg font-bold uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-3" 
            href="/categoria/criptomonedas"
            onClick={() => setIsMenuOpen(false)}
          >
            Criptomonedas
          </Link>
          <Link 
            className="transition-colors text-zinc-800 dark:text-zinc-200 hover:text-[color:var(--color-brand)] text-lg font-bold uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-3" 
            href="/categoria/empresa"
            onClick={() => setIsMenuOpen(false)}
          >
            Empresa
          </Link>

          <Link 
            className="transition-colors text-zinc-800 dark:text-zinc-200 hover:text-[color:var(--color-brand)] text-lg font-bold uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-3" 
            href="/categoria/ia"
            onClick={() => setIsMenuOpen(false)}
          >
            IA
          </Link>
          <Link 
            className="transition-colors text-zinc-800 dark:text-zinc-200 hover:text-[color:var(--color-brand)] text-lg font-bold uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-3" 
            href="/categoria/ciberseguridad"
            onClick={() => setIsMenuOpen(false)}
          >
            Ciberseguridad
          </Link>
          <Link 
            className="transition-colors text-zinc-800 dark:text-zinc-200 hover:text-[color:var(--color-brand)] text-lg font-bold uppercase tracking-wider" 
            href="/sobre-mi"
            onClick={() => setIsMenuOpen(false)}
          >
            Sobre el Autor
          </Link>
        </div>
      )}
    </header>
  );
}