import { SchemaType, type Schema } from '@google/generative-ai';
import { z } from 'zod';

/**
 * Fuente única de verdad para las categorías válidas de un artículo.
 * Se usa tanto en el prompt (config/prompts.ts) como en el responseSchema
 * de Gemini y en la validación zod, para que las tres cosas no puedan
 * desincronizarse entre sí.
 */
export const CATEGORY_VALUES = [
  'Mercados',
  'Tecnología',
  'IA',
  'Ciberseguridad',
  'Criptomonedas',
] as const;

const glossaryItemGemini: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    term: { type: SchemaType.STRING },
    definition: { type: SchemaType.STRING },
  },
  required: ['term', 'definition'],
};

const faqItemGemini: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    question: { type: SchemaType.STRING },
    answer: { type: SchemaType.STRING },
  },
  required: ['question', 'answer'],
};

/**
 * Esquema que se pasa a Gemini (generationConfig.responseSchema) para forzar
 * la forma exacta del JSON de un artículo en español. Sustituye la necesidad
 * de "recuperación por regex" cuando la respuesta viene truncada o mal formada.
 */
export const articleResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    summary: { type: SchemaType.STRING },
    keyPoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    tickers: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    glossary: { type: SchemaType.ARRAY, items: glossaryItemGemini },
    faqs: { type: SchemaType.ARRAY, items: faqItemGemini },
    content: { type: SchemaType.STRING },
    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    imagePrompt: { type: SchemaType.STRING },
    category: { type: SchemaType.STRING, format: 'enum', enum: [...CATEGORY_VALUES] },
  },
  required: ['title', 'summary', 'keyPoints', 'content', 'tags', 'imagePrompt', 'category'],
};

/** Esquema Gemini para la traducción/generación del artículo en inglés. */
export const englishArticleResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    titleEn: { type: SchemaType.STRING },
    summaryEn: { type: SchemaType.STRING },
    keyPointsEn: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    glossaryEn: { type: SchemaType.ARRAY, items: glossaryItemGemini },
    faqsEn: { type: SchemaType.ARRAY, items: faqItemGemini },
    contentEn: { type: SchemaType.STRING },
  },
  required: ['titleEn', 'summaryEn', 'keyPointsEn', 'contentEn'],
};

/** Esquema Gemini para la newsletter semanal. */
export const newsletterResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    subject: { type: SchemaType.STRING },
    htmlContent: { type: SchemaType.STRING },
  },
  required: ['subject', 'htmlContent'],
};

/** Esquema Gemini para el análisis de imágenes (coherencia/calidad/caption). */
export const imageAnalysisResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    coherente: { type: SchemaType.BOOLEAN },
    razon_coherencia: { type: SchemaType.STRING },
    descripcion: { type: SchemaType.STRING },
    calidad_aceptable: { type: SchemaType.BOOLEAN },
    problemas_detectados: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    caption_mejorado: { type: SchemaType.STRING },
  },
  required: ['coherente', 'razon_coherencia', 'descripcion', 'calidad_aceptable'],
};

/** Esquema Gemini para el control de calidad del texto (auditoría contra fuentes). */
export const textQaResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    veredicto: { type: SchemaType.STRING, format: 'enum', enum: ['ok', 'corregir', 'rehacer'] },
    afirmaciones_sin_respaldo: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          cita: { type: SchemaType.STRING },
          motivo: { type: SchemaType.STRING },
        },
        required: ['cita', 'motivo'],
      },
    },
    reglas_incumplidas: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          regla: { type: SchemaType.STRING },
          cita: { type: SchemaType.STRING },
        },
        required: ['regla', 'cita'],
      },
    },
  },
  required: ['veredicto', 'afirmaciones_sin_respaldo', 'reglas_incumplidas'],
};

// --- Validación zod tras el parseo (defensa en profundidad: aunque forcemos
// el schema en la API, seguimos validando por si el modelo se desvía). ---

const glossaryItemZod = z.object({ term: z.string(), definition: z.string() });
const faqItemZod = z.object({ question: z.string(), answer: z.string() });

export const articleZodSchema = z.object({
  title: z.string().min(1),
  summary: z.string().default(''),
  keyPoints: z.array(z.string()).default([]),
  tickers: z.array(z.string()).default([]),
  glossary: z.array(glossaryItemZod).default([]),
  faqs: z.array(faqItemZod).default([]),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
  imagePrompt: z.string().default('technology, digital art'),
  category: z.enum(CATEGORY_VALUES).catch('Tecnología'),
});

export const englishArticleZodSchema = z.object({
  titleEn: z.string().min(1),
  summaryEn: z.string().default(''),
  keyPointsEn: z.array(z.string()).default([]),
  glossaryEn: z.array(glossaryItemZod).default([]),
  faqsEn: z.array(faqItemZod).default([]),
  contentEn: z.string().min(1),
});

export const newsletterZodSchema = z.object({
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
});

export const textQaZodSchema = z.object({
  veredicto: z.enum(['ok', 'corregir', 'rehacer']).catch('corregir' as const),
  afirmaciones_sin_respaldo: z
    .array(z.object({ cita: z.string(), motivo: z.string() }))
    .default([]),
  reglas_incumplidas: z
    .array(z.object({ regla: z.string(), cita: z.string() }))
    .default([]),
});
