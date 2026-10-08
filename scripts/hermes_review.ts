import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { REVIEW_STATUS, buildCallbackData, buildPreviewUrl } from '../lib/review-token';
import { telegramApi } from '../modules/notifications/telegram.service';

/**
 * Revisión de EmeDotHermes.
 *
 * El botón «🤖 EmeDotHermes» del mensaje de aprobación no decide nada: marca el
 * artículo como `hermes_review` y espera a que alguien (una tarea programada de
 * Hermes) lo lea, escriba un diagnóstico y lo devuelva a la bandeja de decisión.
 * Este script es esa pieza:
 *
 *   npx tsx scripts/hermes_review.ts list
 *       Imprime en JSON los artículos pendientes de diagnóstico, con el texto
 *       completo, para poder analizarlos. Si no hay ninguno, no imprime nada.
 *
 *   npx tsx scripts/hermes_review.ts send <id>   (el diagnóstico se pasa por stdin)
 *       Manda el diagnóstico al Telegram del dueño, con los tres botones otra
 *       vez, y devuelve el artículo a `pending` para que se pueda decidir.
 */

const prisma = new PrismaClient();

async function leerStdin(): Promise<string> {
  const trozos: Buffer[] = [];
  for await (const trozo of process.stdin) trozos.push(trozo as Buffer);
  return Buffer.concat(trozos).toString('utf8').trim();
}

async function contar() {
  // Salida determinista y de una sola línea: la usa el monitor de la tarea
  // programada para despertar al agente solo cuando cambia el número.
  const n = await prisma.article.count({ where: { reviewStatus: REVIEW_STATUS.hermesReview } });
  console.log(String(n));
}

/**
 * Salida del monitor: los identificadores pendientes, ordenados, uno por línea
 * (nada si no hay ninguno).
 *
 * Es mejor que contar: si en la misma ventana se diagnostica uno y entra otro,
 * el número no cambia (1 → 1) y el agente no se despertaría. Con los
 * identificadores, cualquier cambio en el conjunto sí lo despierta. La salida
 * es determinista, que es lo que exige el monitor.
 */
async function vigilar() {
  const pendientes = await prisma.article.findMany({
    where: { reviewStatus: REVIEW_STATUS.hermesReview },
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  if (pendientes.length > 0) console.log(pendientes.map((a) => a.id).join('\n'));
}

async function listar() {
  const pendientes = await prisma.article.findMany({
    where: { reviewStatus: REVIEW_STATUS.hermesReview },
    orderBy: { reviewedAt: 'asc' },
    include: { category: true, articleTags: true },
  });

  if (pendientes.length === 0) return;

  console.log(
    JSON.stringify(
      pendientes.map((a) => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        content: a.content,
        sourceUrl: a.sourceUrl,
        imageUrl: a.imageUrl,
        imageCaption: a.imageCaption,
        category: a.category?.name,
        tags: a.articleTags?.map((t) => t.name) ?? [],
        createdAt: a.createdAt.toISOString(),
        wordCount: String(a.content || '').split(/\s+/).length,
      })),
      null,
      1
    )
  );
}

async function enviar(id: string, diagnostico: string) {
  if (!diagnostico) {
    console.error('Falta el diagnóstico (se pasa por stdin).');
    process.exit(1);
  }

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) {
    console.error(`No existe el artículo ${id}`);
    process.exit(1);
  }
  if (!article.reviewToken) {
    console.error('El artículo no tiene token de revisión.');
    process.exit(1);
  }

  const baseUrl = process.env.SITE_URL || 'https://www.emedoteme.es';
  const previewUrl = buildPreviewUrl(baseUrl, article.reviewToken);

  const texto = [
    '🤖 <b>Diagnóstico de EmeDotHermes</b>',
    '',
    `<b>${escapar(article.title)}</b>`,
    '',
    escapar(diagnostico),
    '',
    `🔒 Borrador: ${previewUrl}`,
  ]
    .join('\n')
    .slice(0, 4096);

  const teclado = {
    inline_keyboard: [
      [
        { text: '✅ Sí', callback_data: buildCallbackData('y', article.reviewToken) },
        { text: '❌ No', callback_data: buildCallbackData('n', article.reviewToken) },
      ],
      [{ text: '🤖 EmeDotHermes', callback_data: buildCallbackData('h', article.reviewToken) }],
    ],
  };

  const resultado = await telegramApi('sendMessage', {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: texto,
    parse_mode: 'HTML',
    reply_markup: teclado,
    link_preview_options: { is_disabled: true },
  });

  if (!resultado.ok) {
    console.error(`❌ No se pudo enviar el diagnóstico (${resultado.status}): ${resultado.body}`);
    process.exit(1);
  }

  // Vuelve a la bandeja de decisión: los botones del diagnóstico son los que
  // deciden ahora. La nota guarda el diagnóstico para tener la traza.
  await prisma.article.update({
    where: { id },
    data: {
      reviewStatus: REVIEW_STATUS.pending,
      reviewNote: diagnostico,
    },
  });

  console.log(`Diagnóstico enviado y artículo devuelto a 'pending': ${article.slug}`);
}

function escapar(texto: unknown): string {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function main() {
  const [modo, id] = process.argv.slice(2);

  if (modo === 'list') return listar();
  if (modo === 'count') return contar();
  if (modo === 'watch') return vigilar();
  if (modo === 'send') {
    if (!id) {
      console.error('Uso: hermes_review.ts send <id>  (diagnóstico por stdin)');
      process.exit(1);
    }
    return enviar(id, await leerStdin());
  }

  console.error('Uso: hermes_review.ts list | send <id>');
  process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
