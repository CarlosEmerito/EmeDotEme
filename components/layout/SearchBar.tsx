"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative flex items-center w-full max-w-sm">
      <input
        type="search"
        placeholder="Buscar noticias..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm rounded-full pl-4 pr-10 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      />
      <button
        type="submit"
        className="absolute right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        aria-label="Buscar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </button>
    </form>
  );
}