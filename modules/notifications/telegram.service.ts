import 'dotenv/config';

export interface TelegramNotificationOptions {
  chatId?: string;
  token?: string;
  parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown';
}

/**
 * Servicio para envío de notificaciones vía Telegram.
 */
export async function sendTelegramNotification(
  message: string,
  options: TelegramNotificationOptions = {}
): Promise<boolean> {
  const token = options.token || process.env.TELEGRAM_TOKEN;
  const chatId = options.chatId || process.env.TELEGRAM_CHAT_ID;
  const parseMode = options.parseMode || 'HTML';

  if (!token || !chatId) {
    console.warn('⚠️ Telegram: Token o ChatID no configurados. Saltando notificación.');
    return false;
  }

  try {
    const fetchNode = (await import('node-fetch')).default;
    const response = await fetchNode(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: parseMode
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Telegram Error (${response.status}): ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Telegram Error Exception:', error);
    return false;
  }
}

/**
 * Notificación especializada para errores críticos del sistema.
 */
export async function sendCriticalErrorNotification(error: any): Promise<boolean> {
  const errorMessage = error.message || String(error);
  const text = `❌ <b>ERROR CRÍTICO (EmeDotEme Bot):</b>\n\nEl proceso de publicación falló y fue abortado para preservar la calidad.\n\n<b>Error:</b> ${errorMessage}`;
  
  return sendTelegramNotification(text);
}
