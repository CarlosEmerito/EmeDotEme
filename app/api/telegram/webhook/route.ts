import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { parseCallbackData } from '@/lib/review-token';
import { applyReviewDecision } from '@/modules/articles/review.service';
import {
  answerCallbackQuery,
  editReviewMessage,
  sendTelegramNotification,
} from '@/modules/notifications/telegram.service';

/**
 * Webhook de Telegram: recibe las pulsaciones de los tres botones del mensaje
 * de aprobación (sí / no / EmeDotHermes).
 *
 * Tres controles antes de tocar nada:
 *  1. Quien pulsa tiene que ser el chat del dueño (`TELEGRAM_CHAT_ID`), no
 *     cualquiera que encuentre el mensaje reenviado.
 *  2. El `callback_data` tiene que traer la forma `apr.<acción>.<token>` con un
 *     token de 32 hex.
 *  3. El token tiene que existir en la base de datos (si el borrador ya no está
 *     o se ha borrado, no se hace nada).
 *
 * El trabajo real (cambiar el estado del artículo) vive en
 * `modules/articles/review.service.ts`, que se prueba sin red ni Telegram.
 */

export const dynamic = 'force-dynamic';

function ownerChatId(): string | null {
  return process.env.TELEGRAM_CHAT_ID?.toString().trim() || null;
}

export async function GET() {
  // Telegram comprueba la URL con un GET al registrar el webhook.
  return NextResponse.json({ ok: true, service: 'emedoteme-telegram-webhook' });
}

export async function POST(req: Request) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const header = req.headers.get('x-telegram-bot-api-secret-token');
    if (header !== expectedSecret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let update: Record<string, unknown> | null = null;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callback = (update as any)?.callback_query;
  if (!callback) {
    // Cualquier otro tipo de update (mensajes sueltos al bot) se ignora.
    return NextResponse.json({ ok: true });
  }

  const fromId = callback.from?.id?.toString();
  const chatId = callback.message?.chat?.id;
  const messageId = callback.message?.message_id;
  const owner = ownerChatId();

  if (!owner || fromId !== owner) {
    await answerCallbackQuery(callback.id, 'Este botón no es para ti.');
    return NextResponse.json({ ok: true });
  }

  const parsed = parseCallbackData(callback.data);
  if (!parsed) {
    await answerCallbackQuery(callback.id, 'Botón no reconocido.');
    return NextResponse.json({ ok: true });
  }

  const outcome = await applyReviewDecision(prisma, parsed.token, parsed.action);

  // Refresca las páginas afectadas para que el cambio se vea al instante sin
  // esperar a la revalidación por tiempo (ISR de 1 hora).
  if (outcome.slug) {
    try {
      revalidatePath('/');
      revalidatePath('/noticias');
      revalidatePath(`/articulo/${outcome.slug}`);
      revalidatePath('/en');
      revalidatePath(`/en/article/${outcome.slug}`);
    } catch (error) {
      console.warn('⚠️ No se pudo revalidar tras la decisión editorial:', error);
    }
  }

  if (chatId && messageId) {
    await editReviewMessage({ chatId, messageId, text: outcome.message });
  }
  await answerCallbackQuery(callback.id, outcome.ok ? 'Hecho' : 'No encontrado');

  // Aviso aparte. Editar un mensaje NO genera notificación en Telegram, así que
  // si solo se reescribiera el original, quien pulsa el botón no vería llegar
  // nada. Un mensaje nuevo sí avisa.
  try {
    await sendTelegramNotification(outcome.message);
  } catch {
    // Un fallo del aviso no debe romper la respuesta a Telegram.
  }

  return NextResponse.json({ ok: true, action: parsed.action, applied: outcome.ok });
}
