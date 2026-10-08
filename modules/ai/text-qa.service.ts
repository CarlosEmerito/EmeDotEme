import { AI_PROMPTS } from '../../config/prompts';
import { generateTextWithGemini } from './gemini-text.service';
import { sanitizeJsonString } from '../../lib/json-sanitizer';
import { logWithTime } from '../../lib/logger';
import { articleResponseSchema, articleZodSchema, textQaResponseSchema, textQaZodSchema } from './schemas';
import type { GeneratedArticle } from './ai.service';

/** Una frase del artículo que no se sostiene con las fuentes. */
export interface TextQaIssue {
  cita: string;
  motivo: string;
}

/** Resultado del control de calidad del texto. */
export interface TextQaReport {
  veredicto: 'ok' | 'corregir' | 'rehacer' | 'sin-verificar';
  afirmacionesSinRespaldo: TextQaIssue[];
  reglasIncumplidas: { regla: string; cita: string }[];
  /** Si se ha reescrito el artículo con las correcciones. */
  corregido: boolean;
  /** Incidencias que siguen ahí después de la corrección. */
  incidenciasRestantes: number;
  /** Resumen legible: se guarda como registro editorial y se enseña al aprobar. */
  resumen: string;
}

/**
 * Audita un artículo contra las fuentes de las que salió.
 * Devuelve null si el control no se ha podido ejecutar (API caída, cuota…):
 * en ese caso el artículo sigue su curso, porque la revisión humana sigue
 * estando detrás.
 */
export async function auditArticleText(
  sourcesText: string,
  article: GeneratedArticle,
  task: 'quality' | 'lite' = 'quality'
): Promise<TextQaReport | null> {
  logWithTime('🔎 Control de calidad del texto: auditando contra las fuentes...');

  const result = await generateTextWithGemini({
    systemPrompt: AI_PROMPTS.TEXT_QA.SYSTEM,
    userPrompt: AI_PROMPTS.TEXT_QA.USER(sourcesText, JSON.stringify(articuloParaAuditar(article))),
    maxTokens: 6000,
    // Auditoría: no queremos creatividad, queremos criterio estable.
    temperature: 0.2,
    responseSchema: textQaResponseSchema,
    task,
  });

  if (!result) {
    logWithTime('⚠️ El control de texto no ha podido ejecutarse.');
    return null;
  }

  try {
    const limpio = result.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const inicio = limpio.indexOf('{');
    const fin = limpio.lastIndexOf('}');
    const parsed = textQaZodSchema.parse(JSON.parse(sanitizeJsonString(limpio.substring(inicio, fin + 1))));

    const report: TextQaReport = {
      veredicto: parsed.veredicto,
      afirmacionesSinRespaldo: parsed.afirmaciones_sin_respaldo,
      reglasIncumplidas: parsed.reglas_incumplidas,
      corregido: false,
      incidenciasRestantes: parsed.afirmaciones_sin_respaldo.length,
      resumen: '',
    };
    report.resumen = resumir(report, false);
    logWithTime(
      `🔎 Control de texto: veredicto «${report.veredicto}»` +
        ` (${report.afirmacionesSinRespaldo.length} sin respaldo, ${report.reglasIncumplidas.length} de estilo).`
    );
    return report;
  } catch (error) {
    const motivo = error instanceof Error ? error.message : String(error);
    logWithTime(`⚠️ No se ha podido interpretar la respuesta del control de texto: ${motivo}`);
    logWithTime(`   Respuesta recibida (${result.length} caracteres): ${result.slice(0, 240)}`);
    return null;
  }
}

/** Reescribe el artículo aplicando las correcciones señaladas por la auditoría. */
export async function fixArticleText(
  sourcesText: string,
  article: GeneratedArticle,
  report: TextQaReport
): Promise<GeneratedArticle | null> {
  const problemas = [
    ...report.afirmacionesSinRespaldo.map(
      (p, i) => `${i + 1}. [sin respaldo en las fuentes] «${p.cita}» → ${p.motivo}`
    ),
    ...report.reglasIncumplidas.map(
      (p, i) => `${i + 1}. [estilo: ${p.regla}] «${p.cita}»`
    ),
  ].join('\n');

  logWithTime('✍️ Aplicando correcciones del control de texto...');

  const result = await generateTextWithGemini({
    systemPrompt: AI_PROMPTS.TEXT_FIX.SYSTEM,
    userPrompt: AI_PROMPTS.TEXT_FIX.USER(sourcesText, JSON.stringify(articuloParaAuditar(article)), problemas),
    maxTokens: 6000,
    temperature: 0.3,
    responseSchema: articleResponseSchema,
    task: 'quality',
  });

  if (!result) return null;

  try {
    const limpio = result.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const inicio = limpio.indexOf('{');
    const fin = limpio.lastIndexOf('}');
    return articleZodSchema.parse(JSON.parse(sanitizeJsonString(limpio.substring(inicio, fin + 1))));
  } catch {
    logWithTime('⚠️ La corrección no ha devuelto un artículo válido: se conserva el original.');
    return null;
  }
}

/**
 * Auditoría + una corrección como máximo. Se hace antes de traducir al inglés,
 * para que la versión inglesa traduzca el texto ya corregido.
 */
export async function auditAndFixArticle(
  sourcesText: string,
  article: GeneratedArticle
): Promise<{ articulo: GeneratedArticle; informe: TextQaReport }> {
  const informe = await auditArticleText(sourcesText, article);

  if (!informe) {
    return {
      articulo: article,
      informe: {
        veredicto: 'sin-verificar',
        afirmacionesSinRespaldo: [],
        reglasIncumplidas: [],
        corregido: false,
        incidenciasRestantes: 0,
        resumen: '⚠️ Control de texto: no se pudo ejecutar (fallo de la API). Sin verificar contra las fuentes.',
      },
    };
  }

  if (informe.veredicto === 'ok') return { articulo: article, informe };

  const corregido = await fixArticleText(sourcesText, article, informe);
  if (!corregido) {
    return { articulo: article, informe };
  }

  // Segunda auditoría: solo para dejar constancia de qué queda después de la
  // corrección. No se vuelve a corregir (coste acotado: una corrección) y va
  // con un modelo ligero porque no decide nada, solo documenta.
  const posterior = await auditArticleText(sourcesText, corregido, 'lite');
  const incidenciasRestantes = posterior
    ? posterior.afirmacionesSinRespaldo.length
    : 0;

  const informeFinal: TextQaReport = {
    veredicto: posterior?.veredicto ?? informe.veredicto,
    afirmacionesSinRespaldo: informe.afirmacionesSinRespaldo,
    reglasIncumplidas: informe.reglasIncumplidas,
    corregido: true,
    incidenciasRestantes,
    resumen: '',
  };
  informeFinal.resumen = resumir(informeFinal, true);

  return { articulo: corregido, informe: informeFinal };
}

/** Solo los campos que se auditan: el resto (imagen, categoría…) no se juzga aquí. */
function articuloParaAuditar(article: GeneratedArticle) {
  return {
    title: article.title,
    summary: article.summary,
    keyPoints: article.keyPoints,
    content: article.content,
    faqs: article.faqs ?? [],
  };
}

/** Resumen legible del control: se guarda como registro y se enseña al aprobar. */
function resumir(report: TextQaReport, corregido: boolean): string {
  const partes: string[] = [];

  if (report.afirmacionesSinRespaldo.length === 0 && report.reglasIncumplidas.length === 0) {
    return '✅ Control de texto: sin incidencias (revisado contra las fuentes).';
  }

  partes.push(
    `⚠️ Control de texto: ${report.afirmacionesSinRespaldo.length} afirmación(es) sin respaldo ` +
      `y ${report.reglasIncumplidas.length} incumplimiento(s) de estilo.`
  );
  if (corregido) {
    partes.push(
      report.incidenciasRestantes === 0
        ? 'Reescrito una vez: ya no queda ninguna sin respaldo.'
        : `Reescrito una vez: quedan ${report.incidenciasRestantes} sin respaldo.`
    );
  } else {
    partes.push('Veredicto «rehacer»: conviene descartarlo o reescribirlo a mano.');
  }

  if (report.afirmacionesSinRespaldo.length > 0) {
    partes.push('Afirmaciones señaladas:');
    for (const a of report.afirmacionesSinRespaldo.slice(0, 6)) {
      partes.push(`- «${a.cita}» → ${a.motivo}`);
    }
  }

  return partes.join('\n');
}
