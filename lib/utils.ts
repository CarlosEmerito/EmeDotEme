export function formatRelativeDate(date: Date | string | number): string {
  const now = new Date();
  const articleDate = new Date(date);
  const diffInMs = now.getTime() - articleDate.getTime();
  
  const msInMinute = 60 * 1000;
  const msInHour = 60 * msInMinute;
  const msInDay = 24 * msInHour;

  if (diffInMs < msInMinute) {
    return "hace unos segundos";
  } else if (diffInMs < msInHour) {
    const minutes = Math.floor(diffInMs / msInMinute);
    return `hace ${minutes} minuto${minutes === 1 ? '' : 's'}`;
  } else if (diffInMs < msInDay) {
    const hours = Math.floor(diffInMs / msInHour);
    return `hace ${hours} hora${hours === 1 ? '' : 's'}`;
  } else {
    // If more than 24 hours, return the regular date
    return articleDate.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }
}

export function calculateReadingTime(content: string): number {
  const WORDS_PER_MINUTE = 200;
  const words = content.replace(/<[^>]*>?/gm, '').split(/\s+/).filter(word => word.length > 0).length;
  const minutes = Math.ceil(words / WORDS_PER_MINUTE);
  return minutes || 1;
}

// ============================================================
// GENERACIÓN DE SLUG
// ============================================================

/**
 * Genera un slug URL-friendly a partir de un título.
 * Opcionalmente añade un timestamp para unicidad.
 */
export function generateSlug(title: string, appendTimestamp: boolean = true): string {
  let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  if (appendTimestamp) {
    slug += '-' + Date.now();
  }
  return slug;
}

// ============================================================
// NORMALIZACIÓN DE TEXTOS GENERADOS POR IA
// ============================================================

import { CRYPTO_ACRONYMS, PROPER_NOUNS, TERMS_TO_CAPITALIZE } from '@/config/constants';

/**
 * Convierte un título a sentence case (solo primera letra mayúscula).
 * Preserva nombres propios, siglas y símbolos como $, %.
 */