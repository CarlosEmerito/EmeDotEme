import os
import json
import requests
from dotenv import load_dotenv


def format_qa(qa, label):
    if not qa:
        return f"❌ No se obtuvo análisis para {label}\n"
    lines = [f"\n<b>{label} (QA visual, engine: {qa.get('engine', '-')})</b>"]
    rep = qa.get("report", {})
    if not rep:
        lines.append("Sin respuesta de motor IA.")
        return "\n".join(lines)
    lines.append(
        f"<b>Coherente:</b> {rep.get('coherente')}, <b>Calidad:</b> {rep.get('calidad_aceptable')}"
    )
    lines.append(f"<b>Razón coherencia:</b> {rep.get('razon_coherencia', '-')}")
    lines.append(f"<b>Descripción:</b> {rep.get('descripcion', '-')}")
    pro = rep.get("problemas_detectados")
    if pro:
        if isinstance(pro, list):
            pro = "\n".join(["- " + p for p in pro])
        lines.append(f"<b>Problemas detectados:</b>\n{pro}")
    lines.append(f"<b>Pie generado:</b> {rep.get('caption_mejorado', '-')}")
    return "\n".join(lines)


load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

ARTICLE_PATH = os.path.join(os.path.dirname(__file__), "tmp", "test_article.json")

if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
    print("❌ Falta TELEGRAM_TOKEN o TELEGRAM_CHAT_ID en el .env")
    exit(1)

try:
    with open(ARTICLE_PATH, "r") as f:
        data = json.load(f)
except Exception as e:
    print(f"❌ No se puede leer test_article.json: {e}")
    exit(1)

image_url = data.get("imageUrl")
title = data.get("title", "Sin título generado por IA")
mainQA = data.get("mainQA")
originalQA = data.get("originalQA")
flows = data.get("flows")
usedFallback = data.get("usedFallback")
errors = data.get("errors")
caption = data.get("caption", "Imagen generada automáticamente en modo prueba.")

if not image_url:
    print("❌ No se encontró imageUrl en test_article.json")
    exit(1)

# Compose caption verdad: Título + QA doble
caption_msg = f"<b>📰 {title}</b>\n" + (
    f"\n<i>Fallback visual: {usedFallback}</i>\n" if usedFallback else ""
)
caption_msg += f"\n{caption}\n"
caption_msg += format_qa(mainQA, "IMAGEN FINAL (elegida para artículo)")
if originalQA:
    caption_msg += format_qa(originalQA, "IMAGEN ORIGINAL WEB")
if flows:
    caption_msg += f"\n\n<b>Flows QA:</b> {flows}"
if errors:
    caption_msg += f"\n\n<b>Errores:</b> {errors}"

endpoint = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendPhoto"
# Recorta el caption si excede el límite de Telegram (1024)
if len(caption_msg) > 1024:
    print(
        f"⚠️ Caption demasiado largo para Telegram: {len(caption_msg)} caracteres. Será recortado."
    )
    caption_msg = caption_msg[:1020] + " ..."

payload = {
    "chat_id": TELEGRAM_CHAT_ID,
    "photo": image_url,
    "caption": caption_msg,
    "parse_mode": "HTML",
}

try:
    resp = requests.post(endpoint, data=payload, timeout=60)
    if resp.status_code == 200:
        print("✅ Imagen y QA enviados correctamente a tu Telegram privado.")
    else:
        print("❌ Error enviando a Telegram:", resp.status_code, resp.text)
except Exception as err:
    print("❌ Error al hacer POST a Telegram:", err)
