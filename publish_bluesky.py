import json
import os
import sys
import re
import requests
from atproto import Client, models

BLUESKY_HANDLE = os.environ.get("BLUESKY_HANDLE", "").strip()
BLUESKY_PASSWORD = os.environ.get("BLUESKY_PASSWORD", "").strip()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GEMINI_API_KEY_2 = os.environ.get("GEMINI_API_KEY_2", "").strip()
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5:14b").strip()

DRY_RUN = os.environ.get("DRY_RUN", "true").lower() in {"1", "true", "yes", "on"}

def limpiar_html(texto):
    return re.sub(r"<[^>]+>", "", texto or "").strip()

def resumir_con_gemini(titulo, base):
    api_keys = [k for k in [GEMINI_API_KEY, GEMINI_API_KEY_2] if k]
    
    for i, api_key in enumerate(api_keys):
        is_primary = i == 0
        try:
            prompt = (
                "Eres el analista principal de EmeDotEme en Bluesky.\n"
                "Redacta un post MUY ATRACTIVO y analítico sobre esta noticia.\n"
                "Reglas ESTRICTAS:\n"
                "1. Escribe UNA SOLA ORACIÓN que funcione como un gancho conversacional.\n"
                "2. Usa 1 o 2 emojis relevantes al contexto financiero.\n"
                "3. Incluye 1 hashtag relevante (ej. #Crypto o #Web3).\n"
                "4. NO añadas el enlace.\n"
                "5. NO uses formato Markdown.\n"
                "6. Escribe un análisis breve, que aporte valor real al inversor.\n"
                "7. Escribe SOLAMENTE en Español.\n\n"
                f"Titulo: {titulo}\n"
                f"Texto: {base[:1500]}"
            )
            
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 300,
                    "responseMimeType": "text/plain"
                }
            }
            
            r = requests.post(url, json=payload, timeout=30)
            if r.status_code == 200:
                result = r.json()
                if "candidates" in result and result["candidates"]:
                    texto = result["candidates"][0]["content"]["parts"][0]["text"].strip()
                    texto = texto.replace('"', '').replace('**', '').replace('*', '')
                    return texto
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

def get_best_aihorde_model():
    """Get the best available model sorted by performance"""
    try:
        url = "https://aihorde.net/api/v2/status/models?type=text"
        resp = requests.get(url, timeout=10)
        if resp.status_code != 200:
            return "koboldcpp/L3-8B-Stheno-v3.2"
        
        models = resp.json()
        # Filter: queue < 50
        viable = [m for m in models if m.get('queued', 0) < 50 and m.get('count', 0) > 0]
        if not viable:
            return "koboldcpp/L3-8B-Stheno-v3.2"
        
        # Sort by performance (higher is better)
        viable.sort(key=lambda m: m.get('performance', 0), reverse=True)
        best = viable[0]
        print(f"[info] Mejor modelo: {best['name']} (perf: {best['performance']}, cola: {best['queued']})")
        return best['name']
    except Exception as e:
        print(f"[warn] Error obteniendo modelos: {e}")
        return "koboldcpp/L3-8B-Stheno-v3.2"

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

def resumir_con_ai_horde(titulo, base):
    try:
        url = "https://aihorde.net/api/v2/generate/sync"
        model = get_best_aihorde_model()
        payload = {
            "prompt": (
                "Eres el analista principal de EmeDotEme en Bluesky.\n"
                "Redacta un post MUY ATRACTIVO y analítico.\n"
                "Reglas:\n"
                "- UNA SOLA ORACIÓN como gancho.\n"
                "- 1-2 emojis.\n"
                "- 1 hashtag.\n"
                "- Sin enlace.\n"
                "- En Español.\n\n"
                f"Titulo: {titulo}\n"
                f"Texto: {base[:1500]}"
            ),
            "params": {
                "max_context": 4096,
                "max_length": 400,
                "temperature": 0.7
            },
            "fast_workers": True,
            "models": [model]
        }
        
        r = requests.post(url, json=payload, headers={"apikey": AI_HORDE_API_KEY}, timeout=60)
        if r.status_code == 200:
            result = r.json()
            if "choices" in result and result["choices"]:
                texto = clean_control_chars(result["choices"][0]["text"])
                texto = texto.strip().replace('"', '').replace('**', '').replace('*', '')
                return texto
        return None
    except Exception as e:
        print(f"[warn] AI Horde fallo: {e}")
        return None

def resumir_con_ia(titulo, contenido_sucio):
    base = limpiar_html(contenido_sucio)
    
    # Priority 1: Gemini
    print("[info] Intentando resumir con Gemini...")
    resultado = resumir_con_gemini(titulo, base)
    if resultado:
        print("[ok] Resumen generado con Gemini")
        return resultado
    else:
        print("[info] Gemini no disponible, usando Ollama local...")
    

    
    # Priority 2: Ollama fallback
    print("[info] Intentando resumir con Ollama...")
    try:
        prompt = (
            "Eres el analista principal de EmeDotEme en Bluesky.\n"
            "Redacta un post MUY ATRACTIVO y analítico.\n"
            "Reglas:\n"
            "- UNA SOLA ORACIÓN como gancho.\n"
            "- 1-2 emojis.\n"
            "- 1 hashtag.\n"
            "- Sin enlace.\n"
            "- En Español.\n\n"
            f"Titulo: {titulo}\n"
            f"Texto: {base[:1500]}"
        )
        payload = {"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
        r = requests.post("http://localhost:11434/api/generate", json=payload, timeout=60)
        r.raise_for_status()
        
        texto = r.json().get("response", "").strip()
        texto = clean_control_chars(texto)
        texto = texto.replace('"', '').replace('**', '').replace('*', '')
        texto = re.sub(r"\(Sin firma.*\)", "", texto, flags=re.IGNORECASE).strip()
        texto = re.sub(r"aquí tienes.*:", "", texto, flags=re.IGNORECASE).strip()
        
        lineas = [l.strip() for l in texto.split('\n') if l.strip() and not l.strip().lower().startswith("análisis")]
        if lineas:
            texto = lineas[0]
        
        print("[ok] Resumen generado con Ollama")
        return texto
    except Exception as e:
        print(f"[warn] Ollama fallo: {e}")
        return None

def recortar_texto(texto, limite):
    if len(texto) <= limite: return texto
    
    recortado = texto[:limite]
    ultimo_punto = max(recortado.rfind('.'), recortado.rfind('!'), recortado.rfind('?'))
    
    if ultimo_punto > 0:
        return recortado[:ultimo_punto + 1]
        
    ultimo_espacio = recortado.rfind(' ')
    if ultimo_espacio > 0:
        return recortado[:ultimo_espacio].rstrip() + "."
        
    return recortado.rstrip() + "."

def enviar_bluesky(resumen, sentimiento, titulo, desc, link, img_url):
    footer = "\n\nToda la información gratis en tu bolsillo a través de Telegram: https://t.me/EmeDotEmeNews\n#EmeDotEme"
    linea_sentimiento = f"\n\nSentimiento: {sentimiento}"
    
    espacio_disponible = 300 - len(footer) - len(linea_sentimiento)
    
    texto_recortado = recortar_texto(resumen, espacio_disponible)
    post_content = f"{texto_recortado}{linea_sentimiento}{footer}"
    
    if DRY_RUN:
        print("[dry-run] Simulación de Bluesky. No se publica realmente.")
        print("\n--- INICIO POST ---")
        print(post_content)
        print(f"\n[Tarjeta de Enlace Adjunta] -> {link}")
        print(f"--- FIN POST --- (Longitud: {len(post_content)} caracteres)\n")
        return True

    if not BLUESKY_HANDLE or not BLUESKY_PASSWORD or BLUESKY_HANDLE == "tu_usuario.bsky.social":
        print("[error] Faltan credenciales de Bluesky. Ignorando.")
        return False

    try:
        client = Client()
        client.login(BLUESKY_HANDLE, BLUESKY_PASSWORD)
        
        thumb_blob = None
        if img_url:
            try:
                img_data = requests.get(img_url, timeout=10).content
                thumb_blob = client.upload_blob(img_data).blob
            except Exception as img_e:
                print(f"[warn] No se pudo subir miniatura: {img_e}")

        embed_external = models.AppBskyEmbedExternal.Main(
            external=models.AppBskyEmbedExternal.External(
                title=titulo,
                description=desc[:200] + "..." if len(desc) > 200 else desc,
                uri=link,
                thumb=thumb_blob
            )
        )
        
        client.send_post(text=post_content, embed=embed_external)
        print(f"[ok] Post publicado en Bluesky!")
        return True
    except Exception as e:
        print(f"[error] Excepción en Bluesky: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("[error] Falta el archivo JSON.")
        sys.exit(1)
    
    json_path = sys.argv[1]
    if not os.path.exists(json_path):
        print(f"[error] No se encontro: {json_path}")
        sys.exit(1)

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    titulo = data.get("title", "").strip()
    link = data.get("link", "").strip()
    desc_raw = data.get("description", "").strip()
    desc_limpia = limpiar_html(desc_raw)
    img_url = data.get("imageUrl", "")
    if img_url and img_url.startswith("/"):
        img_url = f"https://emedoteme.es{img_url}"
    sentimiento = data.get("sentiment", "Neutral ➡️")

    print(f"[info] Procesando para Bluesky: {titulo}")
    
    resumen = resumir_con_ia(titulo, desc_raw)
    if not resumen:
        resumen = f"🚨 {titulo[:150]}"

    enviar_bluesky(resumen, sentimiento, titulo, desc_limpia, link, img_url)

if __name__ == "__main__":
    main()
