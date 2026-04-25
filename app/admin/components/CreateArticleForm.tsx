"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createArticle } from "../actions";
import Link from "next/link";
import { RichTextEditor } from "./RichTextEditor";

interface CreateArticleFormProps {
  categories: { id: string; name: string }[];
}

export default function CreateArticleForm({ categories }: CreateArticleFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    summary: "",
    keyPoints: "",
    keyPointsEn: "",
    imageUrl: "",
    imageCaption: "",
    tags: "",
    content: "",
    categoryId: categories[0]?.id || "",
    published: true,
    impactLevel: "Informativo 📰",
    complexity: "Principiante 🟢",
    tickers: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const autoGenerateSlug = () => {
    if (!formData.title) return;
    const generated = formData.title
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setFormData(prev => ({ ...prev, slug: generated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId) {
      alert("Por favor selecciona una categoría.");
      return;
    }
    
    setIsSaving(true);
    
    const dataToSubmit = {
      ...formData,
      tags: formData.tags.split(",").map(t => t.trim()).filter(t => t !== ""),
      keyPoints: formData.keyPoints.split("\n").map(t => t.trim()).filter(t => t !== ""),
      keyPointsEn: formData.keyPointsEn.split("\n").map(t => t.trim()).filter(t => t !== ""),
      tickers: formData.tickers.split(",").map(t => t.trim().toUpperCase()).filter(t => t !== "")
    };

    const result = await createArticle(dataToSubmit);
    
    setIsSaving(false);
    
    if (result.success) {
      alert("✅ Artículo creado correctamente.");
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
            onBlur={autoGenerateSlug}
            required
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white rounded-md px-4 py-2"
          />
        </div>

        {/* Slug */}
        <div className="mb-4">
          <label className="block text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
            URL (Slug)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">emedoteme.es/articulo/</span>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white rounded-md px-4 py-2"
            />
          </div>
        </div>

        {/* Category & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
              Categoría
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white rounded-md px-4 py-2"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-center">
            <label className="block text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
              Estado
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="published"
                checked={formData.published}
                onChange={handleCheckboxChange}
                className="w-5 h-5 accent-[color:var(--color-brand)]"
              />
              <span className="text-sm font-medium">{formData.published ? "Público (Visible)" : "Oculto (Borrador)"}</span>
            </label>
          </div>
        </div>

        {/* Tickers, Impact & Complexity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
              Tickers (Separados por coma)
            </label>
            <input
              type="text"
              name="tickers"
              value={formData.tickers}
              onChange={handleChange}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white rounded-md px-4 py-2"
              placeholder="BTC, ETH, NVDA"
            />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
              Impacto
            </label>
            <select
              name="impactLevel"
              value={formData.impactLevel}
              onChange={handleChange}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white rounded-md px-4 py-2"
            >
              <option value="Alto Impacto 💥">Alto Impacto 💥</option>
              <option value="Impacto Moderado ⚡">Impacto Moderado ⚡</option>
              <option value="Informativo 📰">Informativo 📰</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
              Complejidad
            </label>
            <select
              name="complexity"
              value={formData.complexity}
              onChange={handleChange}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white rounded-md px-4 py-2"
            >
              <option value="Principiante 🟢">Principiante 🟢</option>
              <option value="Intermedio 🟡">Intermedio 🟡</option>
              <option value="Avanzado 🔴">Avanzado 🔴</option>
            </select>
          </div>
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
          {isSaving ? "Publicando..." : "Publicar Noticia"}
        </button>
      </div>
    </form>
  );
}
