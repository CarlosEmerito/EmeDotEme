import json
import os
import re
import logging
from datetime import datetime
import requests

# Setup directo de logger profesional y registros a archivo
LOG_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "emedoteme.log")

# Configuración de logging: solo INFO para nuestro código, WARNING para librerías.
# Usamos solo StreamHandler porque el script de shell (publicar.sh) ya se encarga
# de la persistencia usando 'tee -a' hacia el archivo de logs.
if not logging.getLogger().hasHandlers():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[logging.StreamHandler()],
    )

# Silenciar logs verbosos de librerías de terceros
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("atproto").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)

HISTORIAL_FILE = os.path.join(LOG_DIR, "historial_publicaciones.csv")


# Utils generales ------------------------------------------------------------
def limpiar_html(texto):
    return re.sub(r"<[^>]+>", "", texto or "").strip()


def clean_control_chars(text):
    if not text:
        return text
    return "".join(c if c >= " " or c in "\t\n\r" else " " for c in text)


def load_json_file(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logging.error(f"Error leyendo JSON {path}: {e}")
        return None


def get_env(var, default=None):
    return os.environ.get(var, default)


def is_dry_run():
    return os.environ.get("DRY_RUN", "false").lower() in {"1", "true", "yes", "on"}


# LOGGING & HISTORIAL --------------------------------------------------------
def log_event(msg, level=logging.INFO):
    logging.log(level, msg)


def log_historial(red, status, title, extra=None):
    now = datetime.now().isoformat(timespec="seconds")
    extra_clean = (extra or "").replace('"', "'")
    entry = f'"{now}","{red}","{status}","{title}","{extra_clean}"\n'
    with open(HISTORIAL_FILE, "a", encoding="utf-8") as f:
        f.write(entry)


# IA: RESUMEN UNIFICADO ------------------------------------------------------
def resumen_ai(
    prompt,
    ollama_model=None,
    gemini_api_key=None,
    gemini_api_key_2=None,
    gemini_api_key_3=None,
    prefer_gemini=True,
    max_output_tokens=600,
    **kwargs,
):
    # Detectar modelo de Ollama
    if not ollama_model:
        ollama_model = os.environ.get("OLLAMA_MODEL", "gemma4:26b")

    # Gemini primero si se quiere — prueba las 3 keys en orden
    if prefer_gemini:
        gemini_keys = [k for k in [gemini_api_key, gemini_api_key_2, gemini_api_key_3] if k]
        key_names = ["PRIMARIA", "SECUNDARIA", "TERCIARIA"]
        
        if not gemini_keys:
            log_event("⚠️ No hay API keys de Gemini configuradas, saltando a Ollama...", logging.WARNING)
        else:
            for idx, key in enumerate(gemini_keys):
                kname = key_names[idx] if idx < len(key_names) else f"EXTRA_{idx+1}"
                try:
                    # Actualizado a gemini-2.5-flash
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"
                    payload = {
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.7,
                            "maxOutputTokens": max_output_tokens,
                            "responseMimeType": "text/plain",
                        },
                    }
                    r = requests.post(url, json=payload, timeout=45)
                    
                    if r.status_code == 200:
                        try:
                            result = r.json()
                            candidates = result.get("candidates", [])
                            if candidates and "content" in candidates[0]:
                                text = candidates[0]["content"]["parts"][0]["text"].strip()
                                if text:
                                    log_event(f"✅ Resumen generado con éxito usando Gemini {kname}.")
                                    return text
                        except (json.JSONDecodeError, KeyError, IndexError) as e:
                            log_event(f"[warn] Error parseando respuesta de Gemini {kname}: {e}", logging.WARNING)
                    
                    elif r.status_code == 429:
                        log_event(f"[warn] Gemini {kname} cuota excedida (429), probando siguiente...", logging.WARNING)
                        continue
                    else:
                        log_event(f"[warn] Gemini {kname} error HTTP {r.status_code}: {r.text[:200]}, probando siguiente...", logging.WARNING)
                        continue
                except Exception as e:
                    log_event(f"[warn] Gemini {kname} fallo crítico: {e}", logging.WARNING)
                    continue

    # Fallback Ollama con REINTENTOS y STREAMING
    log_event(f"🔄 Iniciando fallback a Ollama (modelo: {ollama_model})...")
    max_retries = 2
    for attempt in range(max_retries + 1):
        try:
            # Usamos 127.0.0.1 por estabilidad en algunos entornos linux
            ollama_url = os.environ.get("OLLAMA_HOST", "http://localhost:11434") + "/api/generate"
            payload = {
                "model": ollama_model, 
                "prompt": prompt, 
                "stream": True, 
                "keep_alive": "5m", # Mantener en memoria 5 min para posts seguidos
                "options": {
                    "temperature": 0.3, # Más determinista para redes
                    "num_ctx": 4096
                }
            }
            
            r = requests.post(ollama_url, json=payload, timeout=180, stream=True)
            r.raise_for_status()
            
            full_text = ""
            for line in r.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line.decode('utf-8'))
                        if "error" in chunk:
                            raise Exception(f"Ollama API error: {chunk['error']}")
                        
                        texto_fragmento = chunk.get("response", "")
                        full_text += texto_fragmento
                        if chunk.get("done"):
                            break
                    except json.JSONDecodeError:
                        continue
            
            if full_text.strip():
                log_event(f"✅ Resumen generado con éxito usando Ollama ({ollama_model}).")
                return clean_control_chars(full_text.strip())
            
            raise Exception("Ollama devolvió una respuesta vacía")
            
        except Exception as e:
            if attempt < max_retries:
                log_event(f"[warn] Ollama intento {attempt+1} fallido: {e}. Reintentando...", logging.WARNING)
                import time
                time.sleep(5)
            else:
                log_event(f"[error] Fallaron todos los intentos con Ollama: {e}", logging.ERROR)
    
    return None



def obtener_datos_mercado(coins="bitcoin,ethereum"):
    """
    Obtiene los precios actuales de las criptomonedas y (si aplica) el índice de miedo y codicia.
    """
    info = []
    try:
        url = f"https://api.coingecko.com/api/v3/simple/price?ids={coins}&vs_currencies=usd"
        data = requests.get(url, timeout=6).json()
        
        parts = []
        if "bitcoin" in data:
            parts.append(f"BTC: ${data['bitcoin']['usd']:,.0f}")
        if "ethereum" in data:
            parts.append(f"ETH: ${data['ethereum']['usd']:,.0f}")
        if "solana" in data:
            parts.append(f"SOL: ${data['solana']['usd']:.1f}")
            
        info.append(" | ".join(parts).replace(",", ".")) # Format $XX.XXX instead of $XX,XXX in ES
    except Exception:
        pass
        
    try:
        data_fg = requests.get("https://api.alternative.me/fng/", timeout=5).json()
        val = int(data_fg["data"][0]["value"])
        emoji = "🔴" if val <= 25 else "🟢" if val >= 75 else "⚪"
        info.append(f"📊 Miedo/Codicia: {emoji} ({val}/100)")
    except Exception:
        pass
        
    return "\n".join(info)

# --- Fin del módulo común ---

# Al importar este módulo, asegura que existe el directorio de logs y el historial
with open(HISTORIAL_FILE, "a", encoding="utf-8") as f:
    pass
