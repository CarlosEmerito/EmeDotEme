#!/bin/bash
#
# Script centralizado de publicación EMEDOTEME
# Ejecuta todos los pasos y deja logs detallados bajo logs/emedoteme.log
#
# Dos tareas independientes, en este orden:
#   1. Anunciar en redes el artículo aprobado que esté pendiente de anuncio.
#   2. Generar el borrador del día y pedir la aprobación por Telegram.
#
# Nada llega a la web ni a las redes sin el «Sí» de Emérito en Telegram: el
# pipeline solo crea borradores con `published = false`. El anuncio en Binance
# Square, Telegram y Bluesky lo dispara la siguiente ejecución (o este mismo
# guion, si el «Sí» llegó antes).

set -euo pipefail

cd "$(dirname "$0")"

# Asegurar que el directorio de logs existe
mkdir -p logs

# === Cargar .env de forma robusta ===
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

LOGFILE="logs/emedoteme.log"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"
JSON_PATH="tmp/latest_article.json"

# Redirigir toda la salida (stdout y stderr) al logfile y a la consola
exec > >(tee -a "$LOGFILE") 2>&1

# === Logging de inicio ===
echo -e "\n================== 📰 PUBLICAR.sh ($TIMESTAMP) =================="

# === Paso 1: anunciar en redes el artículo aprobado pendiente (si lo hay) ===
echo "[1️⃣] Buscando artículos aprobados pendientes de anunciar..."
rm -f "$JSON_PATH"
npx tsx scripts/announce_approved.ts

if [ -f "$JSON_PATH" ]; then
  echo "[📦] Metadata detectada en $JSON_PATH. Publicando en redes..."

  echo -e "\n[2️⃣] Enviando a Binance Square (scripts/python/publish_direct.py)..."
  if python3 scripts/python/publish_direct.py "$JSON_PATH" 2>&1; then
    echo "[✅] Publicado en Binance Square."
  else
    echo "[⚠️] Falló la publicación en Binance Square."
  fi

  echo -e "\n[3️⃣] Enviando a Telegram (scripts/python/publish_telegram.py)..."
  if python3 scripts/python/publish_telegram.py "$JSON_PATH" 2>&1; then
    echo "[✅] Publicado en Telegram."
  else
    echo "[⚠️] Falló la publicación en Telegram."
  fi

  echo -e "\n[4️⃣] Enviando a Bluesky (scripts/python/publish_bluesky.py)..."
  if python3 scripts/python/publish_bluesky.py "$JSON_PATH" 2>&1; then
    echo "[✅] Publicado en Bluesky."
  else
    echo "[⚠️] Falló la publicación en Bluesky."
  fi
else
  echo "[ℹ️] No hay ningún artículo aprobado pendiente de anunciar."
fi

# === Paso 2: generar el borrador del día y pedir la aprobación ===
echo -e "\n[5️⃣] Generando el borrador del día (scripts/publish.ts)..."
if npx tsx scripts/publish.ts 2>&1; then
  echo "[✅] Borrador generado. La petición de aprobación ya está en Telegram."
else
  echo "❌ Error al generar el borrador. Este ciclo no deja nada que aprobar."
  exit 1
fi

echo -e "\n✅ Proceso completado. Revisa Telegram para aprobar el borrador. ($TIMESTAMP)\n"
echo "==============================================================="
