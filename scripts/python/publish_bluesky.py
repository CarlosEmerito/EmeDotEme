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
    format_hashtags,
)
import requests
from atproto import Client, models

# --- Configuración
BLUESKY_HANDLE = get_env("BLUESKY_HANDLE", "").strip()
BLUESKY_PASSWORD = get_env("BLUESKY_PASSWORD", "").strip()
GEMINI_API_KEY = get_env("GEMINI_API_KEY", "")
GEMINI_API_KEY_2 = get_env("GEMINI_API_KEY_2", "")
GEMINI_API_KEY_3 = get_env("GEMINI_API_KEY_3", "")
OLLAMA_MODEL = get_env("OLLAMA_MODEL", "gemma4:26b").strip()

# --- Helpers


def recortar_texto(texto, limite):
    texto = texto.strip()
    if len(texto) <= limite:
        return texto
    recortado = texto[:limite]
    ultimo_punto = max(recortado.rfind("."), recortado.rfind("!"), recortado.rfind("?"))
    if ultimo_punto > 0:
        return recortado[: ultimo_punto + 1]
    ultimo_espacio = recortado.rfind(" ")
    if ultimo_espacio > 0:
        return recortado[:ultimo_espacio].rstrip() + "."
    return recortado.rstrip() + "."


def construir_post(resumen, hashtags):
    footer = f"\n\nToda la información gratis en tu bolsillo: https://t.me/EmeDotEmeNews\n{hashtags}"
    espacio_disponible = 300 - len(footer)
    texto_recortado = recortar_texto(resumen, espacio_disponible)
    post_content = f"{texto_recortado}{footer}"
    return post_content


def enviar_bluesky(post_content, titulo, desc, link, img_url):
    if is_dry_run():
        log_event(f"[DRY_RUN] Publicación simulada en Bluesky:")
        log_event(post_content)
        return True, "[dry-run]"
    if (
        not BLUESKY_HANDLE
        or not BLUESKY_PASSWORD
        or BLUESKY_HANDLE == "tu_usuario.bsky.social"
    ):
        return False, "Faltan credenciales de Bluesky"
    try:
        client = Client()
        client.login(BLUESKY_HANDLE, BLUESKY_PASSWORD)
        thumb_blob = None
        if img_url:
            try:
                img_data = requests.get(img_url, timeout=10).content
                thumb_blob = client.upload_blob(img_data).blob
            except Exception as img_e:
                log_event(f"[warn] No se pudo subir miniatura: {img_e}", 30)
        embed_external = models.AppBskyEmbedExternal.Main(
            external=models.AppBskyEmbedExternal.External(
                title=titulo,
                description=desc[:200] + "..." if len(desc) > 200 else desc,
                uri=link,
                thumb=thumb_blob,
            )
        )
        client.send_post(text=post_content, embed=embed_external)
        return True, "Publicado en Bluesky"
    except Exception as e:
        return False, f"Excepción: {e}"


# --- Ejecución principal unificada
if __name__ == "__main__":
    if len(sys.argv) < 2:
        log_event("Falta el archivo JSON de entrada", 40)
        log_historial("Bluesky", "ERROR", "", "Sin JSON")
        sys.exit(1)
    article = load_json_file(sys.argv[1])
    if not article:
        log_event("Error cargando JSON de artículo", 40)
        log_historial("Bluesky", "ERROR", "", "No se lee JSON")
        sys.exit(1)
    titulo = article.get("title", "").strip()
    link = article.get("link", "").strip()
    desc = article.get("description", "").strip()
    img_url = article.get("imageUrl", "")
    if img_url and img_url.startswith("/"):
        img_url = f"https://emedoteme.es{img_url}"
    prompt = (
        "Eres el analista principal de EmeDotEme. Redacta un post analítico y conciso para Bluesky.\n"
        "REGLAS:\n"
        "- Una sola oración de impacto que resuma el núcleo técnico o estratégico de la noticia.\n"
        "- Tono profesional, objetivo y sin adornos literarios.\n"
        "- Máximo 1 emoji sobrio.\n"
        "- 1 hashtag técnico relevante.\n"
        "- NO incluyas enlaces ni el título del artículo.\n"
        "- Idioma: Español.\n"
        f"Título: {titulo}\nTexto: {desc[:1500]}\n"
    )
    resumen = resumen_ai(
        prompt,
        ollama_model=OLLAMA_MODEL,
        gemini_api_key=GEMINI_API_KEY,
        gemini_api_key_2=GEMINI_API_KEY_2,
        gemini_api_key_3=GEMINI_API_KEY_3,
        prefer_gemini=True,
        max_output_tokens=260,
    )
    if not resumen:
        resumen = f"🚨 {titulo[:150]}"
    tags = article.get("tags", [])
    hashtags = format_hashtags(tags)
    post_content = construir_post(resumen, hashtags)
    ok, detalle = enviar_bluesky(post_content, titulo, desc, link, img_url)
    if ok:
        log_event(f"[ok] Publicado en Bluesky: {titulo}")
        log_historial("Bluesky", "OK", titulo, detalle)
        sys.exit(0)
    else:
        log_event(f"[ERROR] Falló Bluesky: {detalle}", 40)
        log_historial("Bluesky", "ERROR", titulo, detalle)
        sys.exit(1)
