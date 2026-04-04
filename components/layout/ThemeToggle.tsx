"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useMemo } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const mounted = useMemo(() => {
    if (typeof window === "undefined") return false;
    return true;
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center text-zinc-600 dark:text-zinc-400 focus:outline-none"
      aria-label="Toggle Dark Mode"
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}