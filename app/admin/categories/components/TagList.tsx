"use client";

import { useState } from "react";
import { renameTag, deleteTag } from "../actions";

interface Tag {
  name: string;
  count: number;
}

export default function TagList({ initialTags }: { initialTags: Tag[] }) {
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");

  const handleUpdate = async (oldTag: string) => {
    if (!newTagName || oldTag === newTagName) {
      setEditingTag(null);
      return;
    }

    const res = await renameTag(oldTag, newTagName);
    if (!res.success) alert(res.error || "Error al actualizar la etiqueta");
    else setEditingTag(null);
  };

  const handleDelete = async (tag: string) => {
    if (confirm(`¿Seguro que deseas eliminar la etiqueta '${tag}' de todos los artículos?`)) {
      const res = await deleteTag(tag);
      if (!res.success) alert(res.error || "Error eliminando etiqueta");
    }
  };

  return (
    <div className="space-y-2">
      {initialTags.length === 0 && (
        <p className="text-zinc-500 text-sm italic">No hay etiquetas registradas.</p>
      )}
      
      {initialTags.map(tag => (
        <div key={tag.name} className="border border-zinc-200 dark:border-zinc-800 rounded p-3 flex justify-between items-center">
          {editingTag === tag.name ? (
            <div className="flex gap-2 flex-1">
              <input 
                type="text" 
                value={newTagName} 
                onChange={(e) => setNewTagName(e.target.value)}
                className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleUpdate(tag.name)}
              />
              <button onClick={() => handleUpdate(tag.name)} className="text-blue-500 hover:text-blue-700 text-sm font-bold">Guardar</button>
              <button onClick={() => setEditingTag(null)} className="text-zinc-500 hover:text-zinc-700 text-sm">Cancelar</button>
            </div>
          ) : (
            <>
              <div>
                <span className="font-bold mr-2">{tag.name}</span>
                <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded-full">{tag.count} artículos</span>
              </div>
              <div className="flex gap-3 text-sm">
                <button 
                  onClick={() => {
                    setEditingTag(tag.name);
                    setNewTagName(tag.name);
                  }} 
                  className="text-zinc-500 hover:text-black dark:hover:text-white"
                >
                  Renombrar
                </button>
                <button 
                  onClick={() => handleDelete(tag.name)}
                  className="text-red-500 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
