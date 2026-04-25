"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useMemo } from "react";

const THEMES = ["system", "light", "dark"] as const;
type Theme = (typeof THEMES)[number];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const mounted = useMemo(() => {
    if (typeof window === "undefined") return false;
    return true;
  }, []);

  const nextTheme = () => {
    if (!theme) return "system";
    const currentIndex = THEMES.indexOf(theme as Theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    return THEMES[nextIndex];
  };

  const getThemeIcon = () => {
    if (!theme || theme === "system") return <Monitor size={20} />;
    if (theme === "dark") return <Sun size={20} />;
    return <Moon size={20} />;
  };

  const getThemeLabel = () => {
    if (!theme || theme === "system") return "Sistema";
    if (theme === "dark") return "Claro";
    return "Oscuro";
  };

  if (!mounted) {
    return <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />;
  }

  return (
    <button
      onClick={() => setTheme(nextTheme())}
      className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center text-zinc-600 dark:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
      aria-label={`Cambiar a tema ${getThemeLabel()}`}
      title={`Tema actual: ${theme === "system" ? "Sistema" : theme === "dark" ? "Oscuro" : "Claro"}. Click para cambiar a ${getThemeLabel()}`}
    >
      {getThemeIcon()}
    </button>
  );
}