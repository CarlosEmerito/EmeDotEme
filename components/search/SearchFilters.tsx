"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, X, Calendar, Tag, FolderTree, TrendingUp } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: {
    articles: number;
  };
}

interface SearchFiltersProps {
  categories: Category[];
  popularTags: string[];
  sentimentOptions: string[];
  currentFilters: {
    query?: string;
    category?: string;
    tags?: string[];
    sentiment?: string;
    dateFrom?: string;
    dateTo?: string;
    sort?: string;
  };
  language: 'es' | 'en';
}

export function SearchFilters({ 
  categories, 
  popularTags, 
  sentimentOptions, 
  currentFilters,
  language 
}: SearchFiltersProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    query: currentFilters.query || "",
    category: currentFilters.category || "",
    tags: currentFilters.tags || [],
    sentiment: currentFilters.sentiment || "",
    dateFrom: currentFilters.dateFrom || "",
    dateTo: currentFilters.dateTo || "",
    sort: currentFilters.sort || "newest"
  });

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    
    if (localFilters.query) params.set("q", localFilters.query);
    if (localFilters.category) params.set("category", localFilters.category);
    if (localFilters.tags.length > 0) params.set("tags", localFilters.tags.join(","));
    if (localFilters.sentiment) params.set("sentiment", localFilters.sentiment);
    if (localFilters.dateFrom) params.set("dateFrom", localFilters.dateFrom);
    if (localFilters.dateTo) params.set("dateTo", localFilters.dateTo);
    if (localFilters.sort && localFilters.sort !== "newest") params.set("sort", localFilters.sort);
    
    router.push(`/${language === 'en' ? 'en/' : ''}buscar?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setLocalFilters({
      query: "",
      category: "",
      tags: [],
      sentiment: "",
      dateFrom: "",
      dateTo: "",
      sort: "newest"
    });
    
    // If we're on search page, navigate to clean search
    if (Object.values(currentFilters).some(val => val && (Array.isArray(val) ? val.length > 0 : true))) {
      router.push(`/${language === 'en' ? 'en/' : ''}buscar`);
    }
  };

  const handleTagToggle = (tag: string) => {
    setLocalFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const activeFilterCount = Object.values(currentFilters).filter(val => 
    val && (Array.isArray(val) ? val.length > 0 : val !== "")
  ).length;

  const translations = {
    es: {
      title: "Filtros de Búsqueda",
      searchPlaceholder: "Buscar noticias...",
      categoryLabel: "Categoría",
      allCategories: "Todas las categorías",
      tagsLabel: "Etiquetas",
      sentimentLabel: "Sentimiento",
      dateLabel: "Rango de fechas",
      sortLabel: "Ordenar por",
      sortOptions: {
        relevance: "Relevancia",
        newest: "Más recientes",
        oldest: "Más antiguos"
      },
      apply: "Aplicar filtros",
      clear: "Limpiar filtros",
      activeFilters: "filtro(s) activo(s)",
      from: "Desde",
      to: "Hasta",
      showMore: "Mostrar más",
      showLess: "Mostrar menos"
    },
    en: {
      title: "Search Filters",
      searchPlaceholder: "Search news...",
      categoryLabel: "Category",
      allCategories: "All categories",
      tagsLabel: "Tags",
      sentimentLabel: "Sentiment",
      dateLabel: "Date range",
      sortLabel: "Sort by",
      sortOptions: {
        relevance: "Relevance",
        newest: "Newest",
        oldest: "Oldest"
      },
      apply: "Apply filters",
      clear: "Clear filters",
      activeFilters: "active filter(s)",
      from: "From",
      to: "To",
      showMore: "Show more",
      showLess: "Show less"
    }
  };

  const t = translations[language];

  return (
    <div className="sticky top-8">
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 bg-white dark:bg-zinc-950">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-black dark:text-white flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            {t.title}
          </h3>
          {activeFilterCount > 0 && (
            <span className="text-xs font-bold bg-black dark:bg-white text-white dark:text-black px-2 py-1 rounded-full">
              {activeFilterCount} {t.activeFilters}
            </span>
          )}
        </div>

        {/* Search Query */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            {t.searchPlaceholder}
          </label>
          <input
            type="text"
            value={localFilters.query}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, query: e.target.value }))}
            placeholder={t.searchPlaceholder}
            className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center">
            <FolderTree className="w-4 h-4 mr-2" />
            {t.categoryLabel}
          </label>
          <select
            value={localFilters.category}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, category: e.target.value }))}
            className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
          >
            <option value="">{t.allCategories}</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.slug}>
                {cat.name} ({cat._count.articles})
              </option>
            ))}
          </select>
        </div>

        {/* Tags Filter */}
        {popularTags.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              {t.tagsLabel}
            </label>
            <div className="flex flex-wrap gap-2">
              {popularTags.slice(0, isExpanded ? popularTags.length : 10).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    localFilters.tags.includes(tag)
                      ? "bg-black dark:bg-white text-white dark:text-black font-bold"
                      : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {tag}
                </button>
              ))}
              {popularTags.length > 10 && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  {isExpanded ? t.showLess : t.showMore}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sentiment Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            {t.sentimentLabel}
          </label>
          <select
            value={localFilters.sentiment}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, sentiment: e.target.value }))}
            className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
          >
            <option value="">Todos los sentimientos</option>
            {sentimentOptions.map(sentiment => (
              <option key={sentiment} value={sentiment}>
                {sentiment}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            {t.dateLabel}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">{t.from}</label>
              <input
                type="date"
                value={localFilters.dateFrom}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">{t.to}</label>
              <input
                type="date"
                value={localFilters.dateTo}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            {t.sortLabel}
          </label>
          <select
            value={localFilters.sort}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, sort: e.target.value }))}
            className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
          >
            <option value="newest">{t.sortOptions.newest}</option>
            <option value="relevance">{t.sortOptions.relevance}</option>
            <option value="oldest">{t.sortOptions.oldest}</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleApplyFilters}
            className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-2.5 rounded hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            {t.apply}
          </button>
          
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="w-full flex items-center justify-center space-x-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium py-2.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>{t.clear}</span>
            </button>
          )}
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Filtros activos:
            </h4>
            <div className="flex flex-wrap gap-2">
              {currentFilters.query && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                   &quot;{currentFilters.query}&quot;
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.delete("q");
                      router.push(`/${language === 'en' ? 'en/' : ''}buscar?${params.toString()}`);
                    }}
                    className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {currentFilters.category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                  {categories.find(c => c.slug === currentFilters.category)?.name || currentFilters.category}
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.delete("category");
                      router.push(`/${language === 'en' ? 'en/' : ''}buscar?${params.toString()}`);
                    }}
                    className="ml-2 text-green-600 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {currentFilters.tags && currentFilters.tags.length > 0 && currentFilters.tags.map(tag => (
                <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400">
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      const currentTags = params.get("tags")?.split(",") || [];
                      const newTags = currentTags.filter(t => t !== tag);
                      if (newTags.length > 0) {
                        params.set("tags", newTags.join(","));
                      } else {
                        params.delete("tags");
                      }
                      router.push(`/${language === 'en' ? 'en/' : ''}buscar?${params.toString()}`);
                    }}
                    className="ml-2 text-purple-600 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}