import os
import sys
from social_publish_utils import (
    load_json_file,
    log_event,
    log_historial,
    is_dry_run,
    resumen_ai,
    limpiar_html,
    get_env,
    obtener_datos_mercado,
)
import requests

# --- Config
TOKEN = get_env("TELEGRAM_TOKEN", "").strip()
CHAT_ID = get_env("TELEGRAM_CHAT_ID", "").strip()
CHANNEL_ID = get_env("TELEGRAM_CHANNEL_ID", "").strip()  # Nuevo: id canal publico
GEMINI_API_KEY = get_env("GEMINI_API_KEY", "").strip()
GEMINI_API_KEY_2 = get_env("GEMINI_API_KEY_2", "").strip()
GEMINI_API_KEY_3 = get_env("GEMINI_API_KEY_3", "").strip()
OLLAMA_MODEL = get_env("OLLAMA_MODEL", "llama3.1:8b").strip()
LINK_AFILIADO = "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_00RIF3NDUA"
TEXTO_BOTON_DINERO = "🎁 RECLAMAR HASTA 100$"

# --- Helpers

import html

def crea_mensaje(data, resumen, mercado, sentimiento):
    titulo = html.escape(data.get("title", "").strip())
    resumen = html.escape(resumen)
    sentimiento = html.escape(sentimiento)
    html_dyor = "<i>DYOR: No es consejo financiero.</i>"
    emedoteme = "<b>EmeDotEme</b>"
    hashtags = "#Criptomonedas #Web3 #EmeDotEme"
    if mercado:
        mercado = html.escape(mercado)
        return (
            f"{mercado}\n──────────────\n"
            f"📰 <b>{titulo}</b>\n\n{resumen}\n\nSentimiento del mercado: {sentimiento}\n\n{html_dyor}\n{emedoteme}\n\n{hashtags}"
        )
    else:
        return f"📰 <b>{titulo}</b>\n\n{resumen}\n\nSentimiento del mercado: {sentimiento}\n\n{html_dyor}\n{emedoteme}\n\n{hashtags}"


def enviar_telegram(texto, imagen_url, link_noticia):
    # Prioridad: canal, si está definido; si no, al private chat de pruebas
    chat_id_target = CHANNEL_ID if CHANNEL_ID else CHAT_ID
    if is_dry_run():
        log_event(f"[DRY_RUN] No envío real a Telegram (solo simulación)", 20)
        log_event(texto, 20)
        return True, "[dry-run]"
    if not TOKEN or not (CHAT_ID or CHANNEL_ID):
        return False, "Faltan credenciales de Telegram (chat y/o canal)"
    import json

    teclado = {
        "inline_keyboard": [
            [{"text": "Leer en EmeDotEme.es", "url": link_noticia}],
            [{"text": TEXTO_BOTON_DINERO, "url": LINK_AFILIADO}],
            [
                {
                    "text": "📢 Compartir",
                    "url": f"https://t.me/share/url?url={link_noticia}",
                }
            ],
        ]
    }

    # Con HTML, solo hay que asegurarse que los campos ya vienen escapados
    payload = {"chat_id": chat_id_target, "parse_mode": "HTML"}
    # Solo agrega reply_markup si hay teclado definido y al menos un botón
    if teclado and teclado.get("inline_keyboard"):
        payload["reply_markup"] = json.dumps(teclado)

    endpoint = "/sendMessage"
    if imagen_url:
        payload["photo"] = imagen_url
        payload["caption"] = texto[:1024]
        endpoint = "/sendPhoto"
    else:
        payload["text"] = texto[:4096]
    log_event(
        f"[telegram/HTML] Enviando mensaje: {payload.get('caption', payload.get('text', ''))}"
    )
    try:
        r = requests.post(
            f"https://api.telegram.org/bot{TOKEN}{endpoint}", data=payload, timeout=20
        )
        log_event(f"[telegram/HTML] Status: {r.status_code}, response: {r.text}")
        if r.status_code == 200:
            return True, "Publicado correctamente"
        return False, f"API err: {r.status_code} - {r.text}"
    except Exception as e:
        log_event(f"[telegram/HTML] Excepción al enviar: {e}", 40)
        return False, f"Excepción: {e}"


# --- Ejecución principal unificada
if __name__ == "__main__":
    if len(sys.argv) < 2:
        log_event("Falta el archivo JSON de entrada", 40)
        log_historial("Telegram", "ERROR", "", "Sin JSON")
        sys.exit(1)
    article = load_json_file(sys.argv[1])
    if not article:
        log_event("Error cargando JSON de artículo", 40)
        log_historial("Telegram", "ERROR", "", "No se lee JSON")
        sys.exit(1)
    titulo = article.get("title", "").strip()
    link = article.get("link", "").strip()
    desc = article.get("description", "").strip()
    img = article.get("imageUrl", "")
    if img and img.startswith("/"):
        img = f"https://emedoteme.es{img}"
    sentimiento = article.get("sentiment", "Neutral ➡️")
    mercado = obtener_datos_mercado()
    prompt = (
        "Eres el admin del canal de Telegram de EmeDotEme (noticias cripto).\n"
        "1. Resume la noticia en 3 viñetas, usa emojis y estilo directo.\n"
        "2. NO repitas el título.\n"
        "3. NO uses HTML.\n"
        f"Título: {titulo}\nTexto: {desc[:1800]}\n"
    )
    resumen = resumen_ai(
        prompt,
        ollama_model=OLLAMA_MODEL,
        gemini_api_key=GEMINI_API_KEY,
        gemini_api_key_2=GEMINI_API_KEY_2,
        gemini_api_key_3=GEMINI_API_KEY_3,
        prefer_gemini=True,
        max_output_tokens=600,
    )
    if not resumen:
        resumen = "Resumen no disponible. Haz clic abajo para leer la noticia completa."
    mensaje = crea_mensaje(article, resumen, mercado, sentimiento)
    ok, detalle = enviar_telegram(mensaje, img, link)
    if ok:
        log_event(f"[ok] Publicado en Telegram: {titulo}")
        log_historial("Telegram", "OK", titulo, detalle)
        sys.exit(0)
    else:
        log_event(f"[ERROR] Falló Telegram: {detalle}", 40)
        log_historial("Telegram", "ERROR", titulo, detalle)
        sys.exit(1)
