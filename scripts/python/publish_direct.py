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

SQUARE_API_URL = (
    "https://www.binance.com/bapi/composite/v1/public/pgc/openApi/content/add"
)
BINANCE_SQUARE_API_KEY = get_env("BINANCE_SQUARE_API_KEY", "").strip()
GEMINI_API_KEY = get_env("GEMINI_API_KEY", "").strip()
GEMINI_API_KEY_2 = get_env("GEMINI_API_KEY_2", "").strip()
GEMINI_API_KEY_3 = get_env("GEMINI_API_KEY_3", "").strip()
OLLAMA_MODEL = get_env("OLLAMA_MODEL", "gemma4:26b").strip()
MAX_POST_CHARS = int(get_env("MAX_POST_CHARS", "900"))
def recortar_texto(texto, limite):
    texto = texto.strip()
    if len(texto) <= limite:
        return texto
    return texto[: max(0, limite - 3)].rstrip() + "..."


def construir_post(data, mercado):
    titulo = data.get("title", "").strip()
    desc = data.get("description", "").strip()
    prompt = (
        "Eres el analista técnico senior de EmeDotEme. Redacta una síntesis de mercado profesional para Binance Square.\n"
        "REGLAS:\n"
        "- Contenido estrictamente OBJETIVO y DETALLADO dentro del límite.\n"
        "- Céntrate en datos, cifras y consecuencias de mercado.\n"
        "- MAX 500 caracteres.\n"
        "- NO enlaces, NO emojis.\n"
        "- Usa cashtags técnicos (ej: $BTC) de forma natural.\n"
        "- Estilo de boletín financiero (Reuters/Bloomberg).\n"
        f"Título: {titulo}\nTexto: {desc[:1700]}\n"
        f"Datos de Mercado: {mercado}"
    )
    resumen = resumen_ai(
        prompt,
        ollama_model=OLLAMA_MODEL,
        gemini_api_key=GEMINI_API_KEY,
        gemini_api_key_2=GEMINI_API_KEY_2,
        gemini_api_key_3=GEMINI_API_KEY_3,
        prefer_gemini=True,
        max_output_tokens=500,
    )
    footer = "— Análisis por EmeDotEme\n#Criptomonedas #Web3 #EmeDotEme"
    espacio_disponible = (
        MAX_POST_CHARS - len(titulo) - len(footer) - 25
    )
    if not resumen:
        resumen = (
            recortar_texto(limpiar_html(desc), espacio_disponible)
            or "Actualización del mercado cripto."
        )
    resumen = recortar_texto(resumen, espacio_disponible)
    post = f"{resumen}\n\n{footer}"
    return post


def publicar_en_square(post, imagen_url):
    if is_dry_run():
        log_event(f"[DRY_RUN] Publicación Binance Square simulada:\n{post}")
        return True, "[dry-run]"
    if not BINANCE_SQUARE_API_KEY:
        return False, "Falta BINANCE_SQUARE_API_KEY"
    payload = {
        "categoryId": 8,
        "bodyTextOnly": post,
        "images": [imagen_url] if imagen_url else [],
        "title": "EmeDotEme",
        "sourceUrl": "https://www.emedoteme.es",
        "tags": ["criptomonedas", "bitcoin", "ethereum", "web3", "analisis"],
    }
    headers = {
        "Content-Type": "application/json",
        "X-Square-OpenAPI-Key": BINANCE_SQUARE_API_KEY,
        "clienttype": "binanceSkill",
    }
    try:
        r = requests.post(SQUARE_API_URL, json=payload, headers=headers, timeout=15)
        if r.status_code in [200, 201]:
            # Verificar si la API devolvió éxito real en el body
            try:
                resp_json = r.json()
                if resp_json.get("success") is False or resp_json.get("code") not in [None, 0, "000000"]:
                    body = r.text[:500]
                    return False, f"API rechazó: {body}"
            except Exception:
                pass
            return True, "Publicado en Binance Square"
        
        body = r.text[:500]
        log_event(f"[error] Binance Square error: status={r.status_code} body={body}", 40)
        return False, f"API err: {r.status_code} - {body}"
    except Exception as e:
        return False, f"Excepción: {e}"


if __name__ == "__main__":
    if len(sys.argv) < 2:
        log_event("Falta el archivo JSON de entrada", 40)
        log_historial("BinanceSquare", "ERROR", "", "Sin JSON")
        sys.exit(1)
    article = load_json_file(sys.argv[1])
    if not article:
        log_event("Error cargando JSON de artículo", 40)
        log_historial("BinanceSquare", "ERROR", "", "No se lee JSON")
        sys.exit(1)
    titulo = article.get("title", "").strip()
    img = article.get("imageUrl", "")
    if img and img.startswith("/"):
        img = f"https://emedoteme.es{img}"
    mercado = obtener_datos_mercado()
    post = construir_post(article, mercado)
    ok, detalle = publicar_en_square(post, img)
    if ok:
        log_event(f"[ok] Publicado en Binance Square: {titulo}")
        log_historial("BinanceSquare", "OK", titulo, detalle)
        sys.exit(0)
    else:
        log_event(f"[ERROR] Falló Binance Square: {detalle}", 40)
        log_historial("BinanceSquare", "ERROR", titulo, detalle)
        sys.exit(1)
