"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { updateSobreMiContent } from "../actions";

const RichTextEditor = dynamic(() => import("../../components/RichTextEditor").then(mod => mod.RichTextEditor), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-zinc-100 dark:bg-zinc-900 h-96 rounded-md"></div>,
});

export default function AboutMeForm({ initialContent }: { initialContent: string }) {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    
    const res = await updateSobreMiContent(content);
    
    if (res.success) {
      setMessage({ type: 'success', text: 'Contenido guardado exitosamente.' });
    } else {
      setMessage({ type: 'error', text: res.error || 'Error al guardar.' });
    }
    
    setLoading(false);
    
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded shadow-sm">
      {message && (
        <div className={`p-4 rounded text-sm font-bold ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
          Contenido (HTML)
        </label>
        <div className="prose-editor-container bg-white dark:bg-zinc-950">
          <RichTextEditor value={content} onChange={setContent} />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white font-bold py-2 px-8 rounded transition-colors disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}
