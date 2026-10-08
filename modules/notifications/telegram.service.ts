import 'dotenv/config';
import { buildCallbackData, type ReviewAction } from '../../lib/review-token';

export interface TelegramNotificationOptions {
  chatId?: string;
  token?: string;
  parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown';
}

/**
 * Servicio de Telegram del pipeline y del flujo de aprobación.
 *
 * Se usa desde dos sitios distintos: los scripts de Node del pipeline (que
 * envían el aviso de error y la petición de aprobación) y el webhook de Next
 * (que responde a los botones). Por eso todas las llamadas van por
 * `telegramApi()` y nunca lanzan: un fallo de Telegram no puede tumbar el
 * pipeline ni devolver un 500 a Telegram.
 */

export function escapeHtml(text: unknown): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

interface TelegramResult {
  ok: boolean;
  status: number;
  body: string;
}

/** Llamada cruda a la API de Telegram. Nunca lanza. */
export async function telegramApi(
  method: string,
  payload: Record<string, unknown>,
  token?: string
): Promise<TelegramResult> {
  const botToken = token || process.env.TELEGRAM_TOKEN;
  if (!botToken) {
    return { ok: false, status: 0, body: 'TELEGRAM_TOKEN no configurado' };
  }
  try {
    const fetchNode = (await import('node-fetch')).default;
    const response = await fetchNode(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await response.text();
    return { ok: response.ok, status: response.status, body };
  } catch (error) {
    return { ok: false, status: 0, body: `Excepción: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Servicio para envío de notificaciones vía Telegram.
 */
export async function sendTelegramNotification(
  message: string,
  options: TelegramNotificationOptions = {}
): Promise<boolean> {
  const chatId = options.chatId || process.env.TELEGRAM_CHAT_ID;
  const parseMode = options.parseMode || 'HTML';

  if (!options.token && !process.env.TELEGRAM_TOKEN) {
    console.warn('⚠️ Telegram: Token no configurado. Saltando notificación.');
    return false;
  }
  if (!chatId) {
    console.warn('⚠️ Telegram: ChatID no configurado. Saltando notificación.');
    return false;
  }

  const result = await telegramApi(
    'sendMessage',
    { chat_id: chatId, text: message, parse_mode: parseMode },
    options.token
  );

  if (!result.ok) {
    console.error(`❌ Telegram Error (${result.status}): ${result.body}`);
    return false;
  }

  return true;
}

/**
 * Notificación especializada para errores críticos del sistema.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendCriticalErrorNotification(error: any): Promise<boolean> {
  const errorMessage = error?.message || String(error);
  const text = `❌ <b>ERROR CRÍTICO (EmeDotEme Bot):</b>\n\nEl proceso de publicación falló y fue abortado para preservar la calidad.\n\n<b>Error:</b> ${escapeHtml(errorMessage)}`;

  return sendTelegramNotification(text);
}

export interface ApprovalRequest {
  title: string;
  summary?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  previewUrl: string;
  token: string;
  wordCount?: number;
  tags?: string[];
  chatId?: string;
}

/**
 * Petición de aprobación editorial: marca de registro del artículo.
 *
 * Este mensaje es el único sitio por el que sale el enlace privado del
 * borrador. Lleva tres botones: sí (publicar), no (descartar) y EmeDotHermes
 * (pedir un diagnóstico antes de decidir).
 */
export async function sendApprovalRequest(request: ApprovalRequest): Promise<boolean> {
  const chatId = request.chatId || process.env.TELEGRAM_CHAT_ID;
  if (!process.env.TELEGRAM_TOKEN || !chatId) {
    console.warn('⚠️ Telegram: sin token/chat configurado. No se ha enviado la petición de aprobación.');
    return false;
  }
  if (process.env.DRY_RUN === 'true') {
    console.log(`🧪 [DRY_RUN] Petición de aprobación no enviada. Enlace privado: ${request.previewUrl}`);
    return false;
  }

  const caption = [
    '🗞️ <b>Artículo listo para revisar</b>',
    '',
    `<b>${escapeHtml(request.title)}</b>`,
    escapeHtml(request.summary || ''),
    '',
    `🔒 Enlace privado: ${request.previewUrl}`,
    '',
    `<i>${escapeHtml(request.category || 'General')}${request.wordCount ? ` · ${request.wordCount} palabras` : ''}</i>`,
  ]
    .filter((line) => line !== undefined)
    .join('\n')
    .slice(0, 1024);

  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Sí', callback_data: buildCallbackData('y', request.token) },
        { text: '❌ No', callback_data: buildCallbackData('n', request.token) },
      ],
      [{ text: '🤖 EmeDotHermes', callback_data: buildCallbackData('h', request.token) }],
    ],
  };

  const usePhoto = Boolean(request.imageUrl);
  const result = await telegramApi(usePhoto ? 'sendPhoto' : 'sendMessage', {
    chat_id: chatId,
    parse_mode: 'HTML',
    reply_markup: keyboard,
    ...(usePhoto
      ? { photo: request.imageUrl, caption }
      : { text: `${caption}\n\n<i>(Sin imagen disponible)</i>` }),
  });

  if (!result.ok) {
    console.error(`❌ Telegram (petición de aprobación) (${result.status}): ${result.body}`);
    return false;
  }
  return true;
}

/** Responde a la pulsación de un botón (quita el relojito de «cargando»). */
export async function answerCallbackQuery(callbackQueryId: string, text: string): Promise<void> {
  await telegramApi('answerCallbackQuery', { callback_query_id: callbackQueryId, text: text.slice(0, 200) });
}

/**
 * Reescribe el mensaje de aprobación para dejar constancia de la decisión y
 * retirar los botones. Prueba primero el pie de foto (el mensaje se envió con
 * imagen) y cae al texto si el mensaje no tenía foto.
 */
export async function editReviewMessage(params: {
  chatId: string | number;
  messageId: number;
  text: string;
}): Promise<boolean> {
  const reply_markup = { inline_keyboard: [] as unknown[] };
  const captionResult = await telegramApi('editMessageCaption', {
    chat_id: params.chatId,
    message_id: params.messageId,
    caption: params.text,
    parse_mode: 'HTML',
    reply_markup,
  });
  if (captionResult.ok) return true;

  const textResult = await telegramApi('editMessageText', {
    chat_id: params.chatId,
    message_id: params.messageId,
    text: params.text,
    parse_mode: 'HTML',
    reply_markup,
  });
  if (!textResult.ok) {
    console.error(`❌ Telegram (editar mensaje) (${textResult.status}): ${textResult.body}`);
  }
  return textResult.ok;
}

/** Etiqueta legible de cada acción, para los textos de Telegram. */
export const REVIEW_ACTION_LABEL: Record<ReviewAction, string> = {
  y: 'Sí, publicar',
  n: 'No',
  h: 'EmeDotHermes',
};
