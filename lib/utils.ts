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
export function toSentenceCase(title: string): string {
  if (!title || title.length === 0) return title;

  // Convertir todo a minúsculas primero
  const lowercased = title.toLowerCase();

  // Capitalizar primera letra de la frase
  let sentenceCased = lowercased.charAt(0).toUpperCase() + lowercased.slice(1);

  // Primero: Capitalizar nombres propios (Bitcoin, Ethereum, etc.)
  for (const [lower, proper] of Object.entries(PROPER_NOUNS)) {
    const regex = new RegExp(`\\b${lower}\\b`, 'gi');
    sentenceCased = sentenceCased.replace(regex, proper);
  }

  // Segundo: Mantener siglas en mayúsculas (ETF, SEC, BTC, etc.)
  let result = sentenceCased;
  CRYPTO_ACRONYMS.forEach(word => {
    const regex = new RegExp(`\\b${word.toLowerCase()}\\b`, 'gi');
    result = result.replace(regex, word.toUpperCase());
  });

  return result;
}

/**
 * Normaliza el contenido del artículo asegurando mayúsculas correctas
 * para nombres de criptomonedas, siglas y nombres propios.
 */
export function normalizeArticleContent(article: any): any {
  const normalized = { ...article };

  const fieldsToNormalize = ['title', 'summary', 'content', 'titleEn', 'summaryEn', 'contentEn'];

  for (const field of fieldsToNormalize) {
    if (normalized[field]) {
      let text = normalized[field];

      // Sanitizar escapes dobles (ej. \\n -> espacio)
      text = text.replace(/\\\\n/g, ' ').replace(/\\\\r/g, ' ').replace(/\\\\t/g, ' ');
      // También eliminar cualquier backslash solitario que pueda romper HTML
      text = text.replace(/\\\\(.)/g, '$1');

      for (const [lower, proper] of Object.entries(TERMS_TO_CAPITALIZE)) {
        const regex = new RegExp(`\\b${lower}\\b`, 'gi');
        text = text.replace(regex, proper);
      }

      // Eliminar hashtags de redes sociales (no deben estar en contenido web)
      text = text.replace(/#Criptomonedas\s*#Web3\s*#EmeDotEme/g, '')
                 .replace(/#Criptomonedas/g, '')
                 .replace(/#Web3/g, '')
                 .replace(/#EmeDotEme/g, '')
                 .replace(/\s*\n\s*\n\s*$/g, '\n');

      normalized[field] = text;
    }
  }

  return normalized;
}