"use client";

import { useState } from "react";
import { createCategory, updateCategory, deleteCategory } from "../actions";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { articles: number };
}

export default function CategoryList({ initialCategories }: { initialCategories: Category[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const res = await createCategory(formData);
    if (!res.success) setError(res.error || "Error creando categoría");
    else {
      form.reset();
      setError(null);
    }
  };

  const handleUpdate = async (id: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const res = await updateCategory(id, formData);
    if (!res.success) setError(res.error || "Error editando categoría");
    else {
      setEditingId(null);
      setError(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Seguro que deseas eliminar esta categoría?")) {
      const res = await deleteCategory(id);
      if (!res.success) alert(res.error || "Error eliminando categoría");
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="bg-zinc-50 dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded">
        <h3 className="text-sm font-bold mb-3 uppercase tracking-wider">Añadir Categoría</h3>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <div className="flex gap-2 mb-2">
          <input 
            type="text" 
            name="name" 
            placeholder="Nombre" 
            className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            required
          />
          <input 
            type="text" 
            name="slug" 
            placeholder="slug-url" 
            className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            required
          />
        </div>
        <button type="submit" className="w-full bg-black text-white dark:bg-white dark:text-black py-1.5 px-4 rounded text-sm font-bold">
          Crear
        </button>
      </form>

      <div className="space-y-2">
        {initialCategories.map(cat => (
          <div key={cat.id} className="border border-zinc-200 dark:border-zinc-800 rounded p-3">
            {editingId === cat.id ? (
              <form onSubmit={(e) => handleUpdate(cat.id, e)} className="flex gap-2 items-center">
                <input 
                  type="text" name="name" defaultValue={cat.name} 
                  className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-sm"
                  required
                />
                <input 
                  type="text" name="slug" defaultValue={cat.slug} 
                  className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-sm"
                  required
                />
                <button type="submit" className="text-blue-500 hover:text-blue-700 text-sm font-bold">Guardar</button>
                <button type="button" onClick={() => setEditingId(null)} className="text-zinc-500 hover:text-zinc-700 text-sm">Cancelar</button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold block">{cat.name}</span>
                  <span className="text-xs text-zinc-500">/{cat.slug} • {cat._count.articles} artículos</span>
                </div>
                <div className="flex gap-3 text-sm">
                  <button onClick={() => setEditingId(cat.id)} className="text-zinc-500 hover:text-black dark:hover:text-white">Editar</button>
                  <button 
                    onClick={() => handleDelete(cat.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {initialCategories.length === 0 && (
          <p className="text-zinc-500 text-sm italic">No hay categorías registradas.</p>
        )}
      </div>
    </div>
  );
}
