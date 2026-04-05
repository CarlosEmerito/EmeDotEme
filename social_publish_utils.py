import json
import os
import re
import logging
from datetime import datetime
import requests

# Setup directo de logger profesional y registros a archivo
LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "emedoteme.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler(LOG_FILE, encoding="utf-8"), logging.StreamHandler()],
)

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
    entry = (
        f'"{now}","{red}","{status}","{title}","{(extra or "").replace('"', "'")}"\n'
    )
    with open(HISTORIAL_FILE, "a", encoding="utf-8") as f:
        f.write(entry)


# IA: RESUMEN UNIFICADO ------------------------------------------------------
def resumen_ai(
    prompt,
    ollama_model="qwen2.5:14b",
    gemini_api_key=None,
    gemini_api_key_2=None,
    prefer_gemini=True,
    max_output_tokens=600,
    **kwargs,
):
    # Gemini primero si se quiere
    if prefer_gemini and gemini_api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_api_key}"
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
                result = r.json()
                candidates = result.get("candidates", [])
                if candidates:
                    return candidates[0]["content"]["parts"][0]["text"].strip()
            elif r.status_code == 429 and gemini_api_key_2:
                return resumen_ai(
                    prompt,
                    ollama_model,
                    gemini_api_key_2,
                    None,
                    prefer_gemini,
                    max_output_tokens,
                )
            else:
                log_event(f"[warn] Gemini API error {r.status_code}", logging.WARNING)
        except Exception as e:
            log_event(f"[warn] Gemini fallo: {e}", logging.WARNING)
    # Fallback Ollama
    try:
        payload = {"model": ollama_model, "prompt": prompt, "stream": False}
        r = requests.post(
            "http://localhost:11434/api/generate", json=payload, timeout=60
        )
        r.raise_for_status()
        texto = r.json().get("response", "").strip()
        return clean_control_chars(texto)
    except Exception as e:
        log_event(f"[warn] Ollama fallo: {e}", logging.WARNING)
    return None


# --- Fin del módulo común ---

# Al importar este módulo, asegura que existe el directorio de logs y el historial
with open(HISTORIAL_FILE, "a", encoding="utf-8") as f:
    pass
