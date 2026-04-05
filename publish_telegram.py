import json
import os
import sys
import re
import requests

TOKEN = os.environ.get("TELEGRAM_TOKEN", "").strip()
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GEMINI_API_KEY_2 = os.environ.get("GEMINI_API_KEY_2", "").strip()
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5:14b").strip()

DRY_RUN = os.environ.get("DRY_RUN", "true").lower() in {"1", "true", "yes", "on"}

LINK_AFILIADO = "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_00RIF3NDUA"
TEXTO_BOTON_DINERO = "🎁 RECLAMAR HASTA 100$ GRAN"

def limpiar_html(texto):
    return re.sub(r"<[^>]+>", "", texto or "").strip()

def sanitize_telegram_html(text):
    # Reemplaza tags HTML no balanceados con texto plano
    # Si hay un <b> sin </b> correspondiente, lo eliminamos (tag solamente)
    # Encuentra todos los tags <b> y </b>
    import re
    # Contar aperturas y cierres
    opens = len(re.findall(r'<b\s*>', text, re.IGNORECASE))
    closes = len(re.findall(r'</b\s*>', text, re.IGNORECASE))
    if opens == closes:
        return text
    # Si hay desbalance, eliminar todos los tags <b> y </b>
    text = re.sub(r'</?b\s*>', '', text, flags=re.IGNORECASE)
    return text

def clean_markdown(text):
    # Convierte asteriscos simples a viñetas, mantiene asteriscos dobles para negritas
    import re
    # Reemplazar * que no sean parte de ** con •
    # Patrón: asterisco que no está precedido ni seguido por otro asterisco
    text = re.sub(r'(?<!\*)\*(?!\*)', '•', text)
    return text

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

def obtener_datos_mercado():
    info = []
    try:
        url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd"
        data = requests.get(url, timeout=5).json()
        btc, eth, sol = data['bitcoin']['usd'], data['ethereum']['usd'], data['solana']['usd']
        info.append(f"💎 **BTC:** ${btc:,.0f} | **ETH:** ${eth:,.0f} | **SOL:** ${sol:.1f}")
    except: pass

    try:
        data_fg = requests.get("https://api.alternative.me/fng/", timeout=5).json()
        val = int(data_fg['data'][0]['value'])
        emoji = "🔴" if val <= 25 else "🟢" if val >= 75 else "⚪"
        info.append(f"📊 **Miedo/Codicia:** {emoji} ({val}/100)")
    except: pass
    return "\n".join(info)

def resumir_con_gemini(titulo, base):
    api_keys = [k for k in [GEMINI_API_KEY, GEMINI_API_KEY_2] if k]
    
    for i, api_key in enumerate(api_keys):
        is_primary = i == 0
        try:
            prompt = (
                "Eres el administrador del canal de Telegram de EmeDotEme (noticias cripto).\n"
                "Tu audiencia es joven, inversora y le encantan los emojis y resúmenes directos al grano.\n"
                "Reglas ESTRICTAS:\n"
                "1. Resume la noticia en EXACTAMENTE 3 viñetas cortas y fáciles de leer.\n"
                "2. Usa emojis relevantes en cada viñeta.\n"
                "3. Usa **texto** para negritas (formato Markdown). NO uses HTML.\n"
                "4. NO repitas el título.\n"
                "5. Sé súper directo y atractivo.\n\n"
                f"Titulo: {titulo}\n"
                f"Texto: {base[:2000]}"
            )
            
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 1000,
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






def resumir_con_ia(titulo, contenido_sucio):
    base = limpiar_html(contenido_sucio)
    
    # Priority 1: Gemini
    print("[info] Intentando resumir con Gemini...")
    resultado = resumir_con_gemini(titulo, base)
    if resultado:
        print("[ok] Resumen generado con Gemini")
        return clean_markdown(resultado)
    else:
        print("[info] Gemini no disponible, usando Ollama local...")
    

    
    # Priority 2: Ollama fallback
    print("[info] Intentando resumir con Ollama...")
    try:
        payload = {"model": OLLAMA_MODEL, "prompt": (
            "Eres el administrador del canal de Telegram de EmeDotEme (noticias cripto).\n"
            "Tu audiencia es joven, inversora y le encantan los emojis y resúmenes directos al grano.\n"
            "Reglas ESTRICTAS:\n"
            "1. Resume la noticia en EXACTAMENTE 3 viñetas cortas y fáciles de leer.\n"
            "2. Usa emojis relevantes en cada viñeta.\n"
            "3. Usa **texto** para negritas (formato Markdown). NO uses HTML.\n"
            "4. NO repitas el título.\n"
            "5. Sé súper directo y atractivo.\n\n"
            f"Titulo: {titulo}\n"
            f"Texto: {base[:2000]}"
        ), "stream": False}
        r = requests.post("http://localhost:11434/api/generate", json=payload, timeout=60)
        r.raise_for_status()
        
        texto = r.json().get("response", "").strip()
        texto = clean_control_chars(texto)
        texto = clean_markdown(texto)
        print("[ok] Resumen generado con Ollama")
        return texto
    except Exception as e:
        print(f"[warn] Ollama fallo: {e}")
        return None

def enviar_telegram(texto, imagen_url, link_noticia):
    if DRY_RUN:
        print("[dry-run] Simulación de Telegram.")
        print(f"IMAGEN: {imagen_url}")
        print(f"TEXTO:\n{texto}")
        return True

    if not TOKEN or not CHAT_ID:
        print("[error] Falta TELEGRAM_TOKEN o TELEGRAM_CHAT_ID.")
        return False

    teclado = {
        "inline_keyboard": [
            [{"text": "Leer en EmeDotEme.es", "url": link_noticia}],
            [{"text": TEXTO_BOTON_DINERO, "url": LINK_AFILIADO}], 
            [{"text": "📢 Compartir", "url": f"https://t.me/share/url?url={link_noticia}"}]
        ]
    }
    
    payload = {
        "chat_id": CHAT_ID, 
        "parse_mode": "Markdown", 
        "reply_markup": json.dumps(teclado)
    }
    
    endpoint = "/sendMessage"
    if imagen_url:
        payload["photo"] = imagen_url
        payload["caption"] = texto[:1024]
        endpoint = "/sendPhoto"
        
    try:
        r = requests.post(f"https://api.telegram.org/bot{TOKEN}{endpoint}", data=payload, timeout=20)
        if r.status_code == 200:
            return True
        else:
            print(f"[error] Telegram API: {r.status_code} - {r.text}")
            return False
    except Exception as e:
        print(f"[error] Excepción Telegram: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("[error] Falta el archivo JSON como argumento.")
        sys.exit(1)
    
    json_path = sys.argv[1]
    if not os.path.exists(json_path):
        print(f"[error] No se encontro el archivo: {json_path}")
        sys.exit(1)

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    titulo = data.get("title", "").strip()
    link = data.get("link", "").strip()
    desc = data.get("description", "").strip()
    img = data.get("imageUrl", "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1000&q=80")
    if img and img.startswith("/"):
        img = f"https://emedoteme.es{img}"
    sentimiento = data.get("sentiment", "Neutral ➡️")

    print(f"[info] Procesando para Telegram: {titulo}")
    
    mercado = obtener_datos_mercado()
    resumen = resumir_con_ia(titulo, desc)
    if not resumen:
        resumen = "Resumen no disponible. Haz clic abajo para leer la noticia completa."

    if mercado:
        mensaje = f"{mercado}\n──────────────\n📰 **{titulo}**\n\n{resumen}\n\n**Sentimiento del mercado:** {sentimiento}\n\n*DYOR: No es consejo financiero.*\n*EmeDotEme*"
    else:
        mensaje = f"📰 **{titulo}**\n\n{resumen}\n\n**Sentimiento del mercado:** {sentimiento}\n\n*DYOR: No es consejo financiero.*\n*EmeDotEme*"
    
    ok = enviar_telegram(mensaje, img, link)
    if ok:
        print("[ok]Publicado en Telegram exitosamente.")
    else:
        print("[error]Fallo la publicación en Telegram.")
        sys.exit(1)

if __name__ == "__main__":
    main()
