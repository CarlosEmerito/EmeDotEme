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
 * Convierte un título a sentence case (solo primera letra mayúscula).
 * Preserva nombres propios, siglas y símbolos como $, %.
 */
export function formatTitle(title: string): string {
  if (!title) return title;

  // Normalizar: solo la primera letra del string total es mayúscula por defecto, 
  // el resto se decide palabra a palabra.
  let words = title.split(/\s+/);

  // 1. Pre-procesar para detectar acrónimos multi-palabra como "EE. UU."
  // Este es un enfoque simplificado: si encontramos una coincidencia exacta en CRYPTO_ACRONYMS
  // que contenga espacios, intentamos preservarla.
  let result: string[] = [];

  for (let i = 0; i < words.length; i++) {
    let word = words[i];

    // Check for 2-word acronyms (like "EE. UU.")
    if (i < words.length - 1) {
      const twoWords = `${word} ${words[i+1]}`;
      const cleanTwo = twoWords.toUpperCase().replace(/[¿"'(¡?."'!)\]:,]/g, "");
      if (CRYPTO_ACRONYMS.includes(cleanTwo)) {
        // Mantener puntuación original si es posible o usar la del acrónimo
        result.push(cleanTwo);
        i++; // Saltar la siguiente palabra
        continue;
      }
    }

    const startPunctuation = word.match(/^[¿"'(¡]*/)?.[0] || "";
    const endPunctuation = word.match(/[?."'!)\]:,]*$/)?.[0] || "";
    const coreWord = word.slice(startPunctuation.length, word.length - endPunctuation.length);
    const cleanCore = coreWord.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");

    // Siglas
    if (CRYPTO_ACRONYMS.includes(cleanCore.toUpperCase())) {
      result.push(startPunctuation + cleanCore.toUpperCase() + endPunctuation);
      continue;
    }

    // Nombres Propios
    if (PROPER_NOUNS[cleanCore]) {
      result.push(startPunctuation + PROPER_NOUNS[cleanCore] + endPunctuation);
      continue;
    }

    // Capitalización por posición (Inicio o tras puntuación fuerte)
    const isAfterMajorPunctuation = i > 0 && words[i-1].match(/[.:!?]$/);
    if (i === 0 || isAfterMajorPunctuation) {
      result.push(startPunctuation + coreWord.charAt(0).toUpperCase() + coreWord.slice(1).toLowerCase() + endPunctuation);
    } else {
      result.push(startPunctuation + coreWord.toLowerCase() + endPunctuation);
    }
  }

  return result.join(' ');
}