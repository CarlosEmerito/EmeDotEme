#!/bin/bash
#
# Script de publicación específica para IA en EMEDOTEME
#

set -euo pipefail

cd "$(dirname "$0")"

mkdir -p logs

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

echo -e "\n================== 🤖 PUBLICARIA.sh ($TIMESTAMP) =================="

echo "[1️⃣] Generando artículo de IA con scripts/publish-ia.ts..."
if npx tsx scripts/publish-ia.ts 2>&1; then
  
  echo "[✅] Paso 1 completado exitosamente."

  if [ ! -f "$JSON_PATH" ]; then
    echo "❌ Error: No se encontró $JSON_PATH tras la generación."
    exit 1
  fi

  echo "[📦] Metadata detectada en $JSON_PATH. Iniciando publicación en redes..."

  echo -e "\n[2️⃣] Enviando a Binance Square (scripts/python/publish_direct.py)..."
  python3 scripts/python/publish_direct.py "$JSON_PATH" 2>&1
  echo "[✅] Fin del proceso de Binance Square."

  echo -e "\n[3️⃣] Enviando a Telegram (scripts/python/publish_telegram.py)..."
  python3 scripts/python/publish_telegram.py "$JSON_PATH" 2>&1
  echo "[✅] Fin del proceso de Telegram."

  echo -e "\n[4️⃣] Enviando a Bluesky (scripts/python/publish_bluesky.py)..."
  python3 scripts/python/publish_bluesky.py "$JSON_PATH" 2>&1
  echo "[✅] Fin del proceso de Bluesky."
else
  echo "❌ Error al generar el artículo de IA. Abortando publicación en redes."
  exit 1
fi

echo -e "\n✅ Proceso de IA completado. ($TIMESTAMP)\n"
echo "==============================================================="
