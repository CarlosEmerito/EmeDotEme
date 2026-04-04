"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Artículos", href: "/admin", exact: true },
    { label: "Categorías", href: "/admin/categories" },
    { label: "Newsletter", href: "/admin/newsletter" },
    { label: "Estadísticas", href: "/admin/stats" },
    { label: "Sobre Mí", href: "/admin/sobre-mi" },
  ];

  return (
    <>
      {navItems.map((item) => {
        const isActive = item.exact 
          ? pathname === item.href 
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`py-4 px-2 whitespace-nowrap text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? "border-black dark:border-white text-black dark:text-white"
                : "border-transparent text-zinc-500 hover:text-black dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
