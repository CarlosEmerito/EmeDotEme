import json
import os
import sys
import re
import requests

SQUARE_API_URL = "https://www.binance.com/bapi/composite/v1/public/pgc/openApi/content/add"
BINANCE_SQUARE_API_KEY = os.environ.get("BINANCE_SQUARE_API_KEY", "").strip()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GEMINI_API_KEY_2 = os.environ.get("GEMINI_API_KEY_2", "").strip()
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5:14b").strip()

DRY_RUN = os.environ.get("DRY_RUN", "true").lower() in {"1", "true", "yes", "on"}
MAX_POST_CHARS = int(os.environ.get("MAX_POST_CHARS", "900"))

def limpiar_html(texto):
    return re.sub(r"<[^>]+>", "", texto or "").strip()

def obtener_datos_mercado():
    try:
        url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true"
        data = requests.get(url, timeout=8).json()
        btc = data["bitcoin"]["usd"]
        btc_change = data["bitcoin"]["usd_24h_change"]
        eth = data["ethereum"]["usd"]
        eth_change = data["ethereum"]["usd_24h_change"]
        
        return f"BTC está cotizando a {btc:,.0f} USD ({btc_change:+.1f}%) y ETH a {eth:,.0f} USD ({eth_change:+.1f}%)"
    except Exception:
        return ""

def resumir_con_gemini(titulo, base, mercado):
    api_keys = [k for k in [GEMINI_API_KEY, GEMINI_API_KEY_2] if k]
    
    for i, api_key in enumerate(api_keys):
        is_primary = i == 0
        try:
            contexto_mercado = ""
            if mercado:
                contexto_mercado = f"\n- IMPORTANTE: Dedica una oración súper natural al final relacionando la noticia con el estado actual del mercado ({mercado}). ¡Haz que suene fluido y humano!"
            
            prompt = (
                "Eres el analista principal de EmeDotEme. Redacta una micro-noticia MUY CONCISA y de alto valor para Binance Square basada en el siguiente texto.\n"
                "Reglas ESTRICTAS:\n"
                "- MÁXIMO ABSOLUTO DE 500 CARACTERES. Si te pasas de largo, el texto se cortará y quedará mal.\n"
                "- Usa cashtags obligatorios para TODAS las criptomonedas mencionadas (ejemplo: $BTC, $ETH, $SOL).\n"
                "- Escribe en 'mini-párrafos' separados por una línea en blanco para que sea muy visual y fácil de leer.\n"
                "- Cada mini-párrafo debe tener solo 1 o 2 oraciones como máximo.\n"
                "- NO uses subtítulos, encabezados ni negritas.\n"
                "- PROHIBIDO incluir enlaces web, URLs o invitar a salir de la plataforma.\n"
                "- PROHIBIDO usar palabras como 'giveaway', 'airdrop' o promociones.\n"
                "- PROHIBIDO usar EMOJIS. No generes ningún emoji en el texto bajo ninguna circunstancia.\n"
                "- Tono profesional, analítico y directo."
                f"{contexto_mercado}\n\n"
                f"Titulo: {titulo}\n"
                f"Texto: {base[:2000]}"
            )
            
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 800,
                    "responseMimeType": "text/plain"
                }
            }
            
            r = requests.post(url, json=payload, timeout=30)
            if r.status_code == 200:
                result = r.json()
                if "candidates" in result and result["candidates"]:
                    return result["candidates"][0]["content"]["parts"][0]["text"].strip()
            elif r.status_code == 429:
                print(f"[warn] Cuota API {'primaria' if is_primary else 'secundaria'} agotada, intentando siguiente...")
                continue
            else:
                print(f"[warn] Gemini API error {r.status_code}")
                continue
        except Exception as e:
            print(f"[warn] Gemini {'primaria' if is_primary else 'secundaria'} fallo: {e}")
            continue
    
    return None



def clean_control_chars(text):
    """Remove control characters from text"""
    if not text:
        return text
    result = ''
    for char in text:
        if char == '\\':
            result += char
        elif char == '"':
            result += char
        elif char in '\t\n\r':
            result += char
        elif ord(char) < 32:
            result += ' '
        else:
            result += char
    return result



def resumir_con_ia(titulo, contenido_sucio, mercado):
    base = limpiar_html(contenido_sucio)
    
    # Priority 1: Gemini
    print("[info] Intentando resumir con Gemini...")
    resultado = resumir_con_gemini(titulo, base, mercado)
    if resultado:
        print("[ok] Resumen generado con Gemini")
        return resultado
    else:
        print("[info] Gemini no disponible, usando Ollama local...")
    

    
    # Priority 2: Ollama fallback
    print("[info] Intentando resumir con Ollama...")
    try:
        contexto_mercado = ""
        if mercado:
            contexto_mercado = f"\n- IMPORTANTE: Dedica una oración al final relacionando con el mercado ({mercado}).\n"
            
        payload = {"model": OLLAMA_MODEL, "prompt": (
            "Eres el analista principal de EmeDotEme. Redacta una micro-noticia MUY CONCISA para Binance Square.\n"
            "Reglas:\n"
            "- MÁXIMO 500 CARACTERES.\n"
            "- Usa cashtags ($BTC, $ETH, $SOL).\n"
            "- NO uses emojis.\n"
            "- Tono profesional.\n"
            f"{contexto_mercado}\n"
            f"Titulo: {titulo}\n"
            f"Texto: {base[:2000]}"
        ), "stream": False}
        r = requests.post("http://localhost:11434/api/generate", json=payload, timeout=60)
        r.raise_for_status()
        
        texto = r.json().get("response", "").strip()
        texto = clean_control_chars(texto)
        print("[ok] Resumen generado con Ollama")
        return texto
    except Exception as e:
        print(f"[warn] Ollama fallo: {e}")
        return None

def recortar_texto(texto, limite):
    texto = texto.strip()
    if len(texto) <= limite: return texto
    return texto[: max(0, limite - 3)].rstrip() + "..."

def construir_post(data):
    titulo = data.get("title", "").strip()
    desc = data.get("description", "").strip()
    sentimiento = data.get("sentiment", "Neutral ➡️")

    mercado_datos = obtener_datos_mercado()
    resumen = resumir_con_ia(titulo, desc, mercado_datos)
    
    footer = "— Análisis por EmeDotEme\n#Criptomonedas #Web3 #EmeDotEme"
    
    espacio_disponible = MAX_POST_CHARS - len(titulo) - len(sentimiento) - len(footer) - 25
    
    if not resumen:
        resumen = recortar_texto(limpiar_html(desc), espacio_disponible) or "Actualización del mercado cripto."
    
    resumen = recortar_texto(resumen, espacio_disponible)
    
    post = f"{resumen}\n\n{footer}"
    return post, sentimiento

def publicar_en_square(post, sentimiento, imagen_url):
    if DRY_RUN:
        print(f"[dry-run] Post para Binance Square:\n{post}\n")
        print(f"[dry-run] Sentimiento: {sentimiento}")
        print(f"[dry-run] Imagen: {imagen_url}")
        return True
    
    if not BINANCE_SQUARE_API_KEY:
        print("[error] Falta BINANCE_SQUARE_API_KEY")
        return False
    
    payload = {
        "categoryId": 8,
        "content": post,
        "images": [imagen_url] if imagen_url else [],
        "title": "EmeDotEme",
        "sourceUrl": "https://www.emedoteme.es",
        "tags": ["criptomonedas", "bitcoin", "ethereum", "web3", "analisis"]
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-Wallet-Id": BINANCE_SQUARE_API_KEY
    }
    
    try:
        r = requests.post(SQUARE_API_URL, json=payload, headers=headers, timeout=15)
        if r.status_code in [200, 201]:
            print("[ok]Publicado en Binance Square.")
            return True
        else:
            print(f"[error] Binance Square API: {r.status_code} - {r.text[:200]}")
            return False
    except Exception as e:
        print(f"[error]Excepción: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("[error]Falta archivo JSON")
        sys.exit(1)
    
    with open(sys.argv[1], 'r') as f:
        data = json.load(f)
    
    print(f"[info]Procesando: {data.get('title', '')}")
    
    img = data.get("imageUrl", "")
    if img and not img.startswith("http"):
        img = f"https://emedoteme.es{img}"
    
    post, sentimiento = construir_post(data)
    ok = publicar_en_square(post, sentimiento, img)
    
    if not ok:
        sys.exit(1)

if __name__ == "__main__":
    main()
