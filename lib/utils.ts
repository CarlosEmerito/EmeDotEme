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

export function translateCategory(name: string, lang: 'es' | 'en'): string {
  if (lang === 'es') return name;
  
  const mappings: Record<string, string> = {
    'Criptomonedas': 'Cryptocurrencies',
    'Mercados': 'Markets',
    'Tecnología': 'Technology',
    'Ciberseguridad': 'Cybersecurity',
    'IA': 'AI',
    'Tecnologia': 'Technology'
  };

  return mappings[name] || name;
}


// ============================================================
// GENERACIÓN DE SLUG
// ============================================================

export { generateSlug } from './slug';

// ============================================================
// NORMALIZACIÓN DE TEXTOS GENERADOS POR IA
// ============================================================

import { CRYPTO_ACRONYMS, PROPER_NOUNS, TERMS_TO_CAPITALIZE } from '@/config/constants';

/**
 * Normaliza el título generado por la IA. 
 * Confiamos en que la IA siga las instrucciones del prompt respecto a siglas (IBM, AI).
 * Solo nos aseguramos de que la primera letra sea mayúscula si la IA la olvidó.
 */
export function formatTitle(title: string): string {
  if (!title) return title;
  
  // Trim espacios extra
  const trimmed = title.trim();
  
  // Asegurar que la primera letra sea mayúscula, manteniendo el resto tal cual viene de la IA
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}