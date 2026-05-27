"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FolderTree, 
  Mail, 
  BarChart3, 
  User,
  Search,
  Home
} from "lucide-react";
import { useState } from "react";

export function AdminNav() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const navItems = [
    { label: "Dashboard", href: "/admin", exact: true, icon: Home },
    { label: "Categorías", href: "/admin/categories", icon: FolderTree },
    { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
    { label: "Estadísticas", href: "/admin/stats", icon: BarChart3 },
    { label: "Sobre Mí", href: "/admin/sobre-mi", icon: User },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/admin?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex space-x-1 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`py-4 px-4 whitespace-nowrap text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                isActive
                  ? "border-black dark:border-white text-black dark:text-white bg-zinc-50 dark:bg-zinc-900/50"
                  : "border-transparent text-zinc-500 hover:text-black dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      
      <form onSubmit={handleSearch} className="hidden md:flex items-center ml-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar artículos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
          />
        </div>
      </form>
    </div>
  );
}
