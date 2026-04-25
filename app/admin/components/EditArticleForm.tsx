"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateArticle } from "../actions";
import Link from "next/link";
import Image from "next/image";
import { RichTextEditor } from "./RichTextEditor";

interface EditArticleProps {
  article: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    content: string;
    keyPoints?: string[];
    keyPointsEn?: string[];
    imageUrl: string | null;
    imageCaption: string | null;
    articleTags?: { name: string }[];
  };
}

export default function EditArticleForm({ article }: EditArticleProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: article.title || "",
    slug: article.slug || "",
    summary: article.summary || "",
    keyPoints: article.keyPoints ? article.keyPoints.join("\n") : "",
    keyPointsEn: article.keyPointsEn ? article.keyPointsEn.join("\n") : "",
    imageUrl: article.imageUrl || "",
    imageCaption: article.imageCaption || "",
    tags: article.articleTags ? article.articleTags.map(t => t.name).join(", ") : "",
    content: article.content || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const dataToSubmit = {
      ...formData,
      tags: formData.tags.split(",").map(t => t.trim()).filter(t => t !== ""),
      keyPoints: formData.keyPoints.split("\n").map(t => t.trim()).filter(t => t !== ""),
      keyPointsEn: formData.keyPointsEn.split("\n").map(t => t.trim()).filter(t => t !== "")
    };

    const result = await updateArticle(article.id, dataToSubmit);
    
    setIsSaving(false);
    
    if (result.success) {
      alert("✅ Artículo actualizado correctamente.");
      router.push("/admin");
    } else {
      alert(result.error || "Ocurrió un error al guardar.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        
        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
            Titular
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white rounded-md px-4 py-2"
          />
        </div>

        {/* Slug */}
        <div className="mb-4">
          <label className="block text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
            URL (Slug)
          </label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            required
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white rounded-md px-4 py-2"
          />
        </div>

        {/* Summary */}
        <div className="mb-4">
          <label className="block text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
            Resumen
          </label>
          <textarea
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            rows={3}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white rounded-md px-4 py-2"
          />
        </div>

        {/* Key Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
              Puntos Clave (Uno por línea)
            </label>
            <textarea
              name="keyPoints"
              value={formData.keyPoints}
              onChange={handleChange}
              rows={3}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white rounded-md px-4 py-2"
              placeholder="Punto 1&#10;Punto 2&#10;Punto 3"
            />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
              Key Takeaways (English - One per line)
            </label>
            <textarea
              name="keyPointsEn"
              value={formData.keyPointsEn}
              onChange={handleChange}
              rows={3}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white rounded-md px-4 py-2"
              placeholder="Point 1&#10;Point 2&#10;Point 3"
            />
          </div>
        </div>

        {/* Image URL & Caption */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
              URL de la Imagen
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white rounded-md px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
              Pie de Foto (Caption)
            </label>
            <input
              type="text"
              name="imageCaption"
              value={formData.imageCaption}
              onChange={handleChange}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white rounded-md px-4 py-2"
            />
          </div>
        </div>

        {/* Image Preview (if URL exists) */}
        {formData.imageUrl && (
          <div className="mb-6">
            <p className="text-sm text-zinc-500 mb-2 italic">Vista previa de imagen:</p>
            <div className="relative h-48 w-full">
              <Image 
                src={formData.imageUrl} 
                alt="Preview" 
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover rounded-md border border-zinc-200 dark:border-zinc-800"
              />
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="mb-4">
          <label className="block text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
            Etiquetas (Tags - separadas por coma)
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="ej. Bitcoin, Regulación, Mercado"
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white rounded-md px-4 py-2"
          />
        </div>

        {/* Content (HTML) */}
        <div className="mb-6">
          <label className="block text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
            Contenido
          </label>
          <RichTextEditor 
            value={formData.content}
            onChange={(val) => setFormData(prev => ({ ...prev, content: val }))}
          />
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Link 
          href="/admin"
          className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold uppercase tracking-wider text-sm rounded transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 bg-[color:var(--color-brand)] hover:opacity-90 text-white font-bold uppercase tracking-wider text-sm rounded transition-opacity disabled:opacity-50"
        >
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );
}