"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function LanguageSync() {
  const pathname = usePathname();

  useEffect(() => {
    const lang = pathname?.startsWith("/en") ? "en" : "es";
    document.documentElement.lang = lang;
  }, [pathname]);

  return null;
}
