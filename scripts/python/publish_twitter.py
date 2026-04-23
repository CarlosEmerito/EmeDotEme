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
)
import requests
import tweepy

API_KEY = get_env("TWITTER_API_KEY", "").strip()
API_SECRET = get_env("TWITTER_API_SECRET", "").strip()
ACCESS_TOKEN = get_env("TWITTER_ACCESS_TOKEN", "").strip()
ACCESS_TOKEN_SECRET = get_env("TWITTER_ACCESS_TOKEN_SECRET", "").strip()
OLLAMA_MODEL = get_env("OLLAMA_MODEL", "gemma4:26b").strip()


def resumir_tweet(titulo, desc):
    prompt = (
        "Eres el Community Manager de EmeDotEme en Twitter (X).\n"
        "Redacta un tweet VIRAL y DIRECTO, máximo 200 caracteres, 1-2 emojis, 2-3 hashtags relevantes, sin enlace y sin Markdown. Titular de 'Breaking News', tono ágil.\n"
        f"Título: {titulo}\nTexto: {desc[:1200]}\n"
    )
    return resumen_ai(
        prompt, ollama_model=OLLAMA_MODEL, max_output_tokens=200, prefer_gemini=False
    )


def enviar_tweet(texto, link):
    tweet_content = f"{texto}\n\n👉 {link}"
    if is_dry_run():
        log_event(f"[DRY_RUN] Simulación de tweet:\n{tweet_content}")
        return True, "[dry-run]"
    if not all([API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET]):
        return False, "Faltan credenciales Twitter/X"
    try:
        client = tweepy.Client(
            consumer_key=API_KEY,
            consumer_secret=API_SECRET,
            access_token=ACCESS_TOKEN,
            access_token_secret=ACCESS_TOKEN_SECRET,
        )
        response = client.create_tweet(text=tweet_content)
        return True, f"Tweet OK: {response.data['id']}"
    except Exception as e:
        return False, f"Excepción: {e}"


if __name__ == "__main__":
    if len(sys.argv) < 2:
        log_event("Falta el archivo JSON de entrada", 40)
        log_historial("Twitter", "ERROR", "", "Sin JSON")
        sys.exit(1)
    article = load_json_file(sys.argv[1])
    if not article:
        log_event("Error cargando JSON de artículo", 40)
        log_historial("Twitter", "ERROR", "", "No se lee JSON")
        sys.exit(1)
    titulo = article.get("title", "").strip()
    link = article.get("link", "").strip()
    desc = article.get("description", "").strip()
    resumen = resumir_tweet(titulo, desc)
    if not resumen:
        resumen = f"🚨 {titulo[:150]}"
    ok, detalle = enviar_tweet(resumen, link)
    if ok:
        log_event(f"[ok] Publicado en Twitter (X): {titulo}")
        log_historial("Twitter", "OK", titulo, detalle)
        sys.exit(0)
    else:
        log_event(f"[ERROR] Falló publicación Twitter: {detalle}", 40)
        log_historial("Twitter", "ERROR", titulo, detalle)
        sys.exit(1)
