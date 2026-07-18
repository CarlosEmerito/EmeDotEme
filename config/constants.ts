/**
 * Constantes compartidas del proyecto EmeDotEme.
 * Centraliza valores que se usaban duplicados en múltiples archivos.
 */

// ============================================================
// IMÁGENES DE FALLBACK (Unsplash)
// ============================================================

/**
 * Imágenes de stock por categoría usadas como fallback cuando no se puede
 * obtener ni generar una imagen para un artículo.
 */
export const FALLBACK_IMAGES: Record<string, string[]> = {
  "Criptomonedas": [
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1605792657660-596af9009e82?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1200&auto=format&fit=crop",
  ],
  "Empresa": [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop",
  ],
  "IA": [
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1639762681057-408e52192e55?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?q=80&w=1200&auto=format&fit=crop",
  ],
};

// ============================================================
// CATEGORÍAS BASE
// ============================================================

export const BASE_CATEGORIES = ["Criptomonedas", "IA", "Mercados", "Tecnología", "Ciberseguridad"] as const;
