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


def to_hashtag(tag):
    parts = re.split(r'[\s\-_]+', tag.strip())
    hashtag_parts = []
    for p in parts:
        clean = re.sub(r'[^a-zA-Z0-9]', '', p)
        if clean:
            capitalized = clean[0].upper() + clean[1:] if len(clean) > 0 else ""
            hashtag_parts.append(capitalized)
    if hashtag_parts:
        return "#" + "".join(hashtag_parts)
    return ""


def format_hashtags(tags, primary_tag="EmeDotEme"):
    formatted_tags = [f"#{primary_tag}"]
    seen_tags_lower = {primary_tag.lower()}
    
    for tag in (tags or []):
        hashtag = to_hashtag(tag)
        if hashtag:
            hashtag_lower = hashtag.lstrip('#').lower()
            if hashtag_lower not in seen_tags_lower:
                formatted_tags.append(hashtag)
                seen_tags_lower.add(hashtag_lower)
                
    return " ".join(formatted_tags)


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
    gemini_api_key=None,
    gemini_api_key_2=None,
    gemini_api_key_3=None,
    prefer_gemini=True,
    **kwargs,
):
    max_output_tokens = kwargs.get("max_output_tokens", 600)
    # Gemini primero si se quiere — prueba las 3 keys en orden
    if prefer_gemini:
        gemini_keys = [k for k in [gemini_api_key, gemini_api_key_2, gemini_api_key_3] if k]
        key_names = ["PRIMARIA", "SECUNDARIA", "TERCIARIA"]
        
        if not gemini_keys:
            log_event("⚠️ No hay API keys de Gemini configuradas.", logging.WARNING)
        else:
            retries = [30, 60, 120]  # Esperas de 30s, 60s y 120s
            
            for idx, key in enumerate(gemini_keys):
                kname = key_names[idx] if idx < len(key_names) else f"EXTRA_{idx+1}"
                attempt = 0
                
                while True:
                    try:
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
                        
                        # Comprobar si hay error de sobrecarga / alta demanda (HTTP 503 o texto de error)
                        is_overloaded = r.status_code == 503 or (
                            r.status_code != 200 and (
                                "overloaded" in r.text.lower() or
                                "service unavailable" in r.text.lower() or
                                "temporarily unavailable" in r.text.lower()
                            )
                        )
                        
                        if is_overloaded and attempt < len(retries):
                            wait_time = retries[attempt]
                            log_event(f"⚠️ Alta demanda/Sobrecarga en Gemini {kname}. Reintentando en {wait_time}s (intento {attempt + 1}/{len(retries)})...", logging.WARNING)
                            import time
                            time.sleep(wait_time)
                            attempt += 1
                            continue
                        
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
                                break # Rompe el bucle while y pasa a la siguiente clave API
                        
                        elif r.status_code == 429:
                            log_event(f"[warn] Gemini {kname} cuota excedida (429), probando siguiente...", logging.WARNING)
                            break # Pasa a la siguiente clave API
                        else:
                            log_event(f"[warn] Gemini {kname} error HTTP {r.status_code}: {r.text[:200]}, probando siguiente...", logging.WARNING)
                            break # Pasa a la siguiente clave API
                            
                    except Exception as e:
                        # Reintentar ante errores transitorios de red / de resolución DNS
                        if attempt < len(retries):
                            wait_time = retries[attempt]
                            log_event(f"⚠️ Error de conexión con Gemini {kname}: {e}. Reintentando en {wait_time}s...", logging.WARNING)
                            import time
                            time.sleep(wait_time)
                            attempt += 1
                            continue
                        
                        log_event(f"[warn] Gemini {kname} fallo crítico persistente: {e}", logging.WARNING)
                        break # Pasa a la siguiente clave API

    log_event("❌ Fallaron todas las API keys de Gemini.", logging.ERROR)
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
