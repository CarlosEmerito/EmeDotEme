"use client";

import { useState } from "react";
import { formatRelativeDate } from "@/lib/utils";
import { togglePublishStatus, deleteArticle } from "../actions";
import Link from "next/link";

type ArticleWithCategory = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  createdAt: Date;
  category: { name: string };
};

export default function ArticleTable({ initialArticles }: { initialArticles: ArticleWithCategory[] }) {
  const [articles, setArticles] = useState(initialArticles);
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setLoadingIds(prev => ({ ...prev, [id]: true }));
    
    const newStatus = !currentStatus;
    const res = await togglePublishStatus(id, newStatus);
    
    if (res.success) {
      setArticles(prev => prev.map(art => 
        art.id === id ? { ...art, published: newStatus } : art
      ));
    } else {
      alert(res.error || "Ocurrió un error");
    }
    
    setLoadingIds(prev => ({ ...prev, [id]: false }));
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas ELIMINAR permanentemente el artículo "${title}"?`)) {
      return;
    }
    
    setLoadingIds(prev => ({ ...prev, [id]: true }));
    
    const res = await deleteArticle(id);
    
    if (res.success) {
      setArticles(prev => prev.filter(art => art.id !== id));
    } else {
      alert(res.error || "No se pudo eliminar");
      setLoadingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 uppercase text-xs tracking-wider font-bold">
            <tr>
              <th className="px-6 py-4">Noticia</th>
              <th className="px-6 py-4">Categoría</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4 text-center">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {articles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 italic">No hay noticias generadas todavía.</td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-black dark:text-white max-w-xs">
                    <div className="truncate" title={article.title}>
                      <Link href={`/articulo/${article.slug}`} target="_blank" className="hover:text-[color:var(--color-brand)]">
                        {article.title}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold">
                      {article.category.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatRelativeDate(article.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(article.id, article.published)}
                      disabled={loadingIds[article.id]}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-opacity disabled:opacity-50 ${
                        article.published 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}
                    >
                      {loadingIds[article.id] ? "..." : (article.published ? "Público" : "Oculto")}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(article.id, article.title)}
                      disabled={loadingIds[article.id]}
                      className="text-red-500 hover:text-red-700 font-semibold text-xs uppercase tracking-wider disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}