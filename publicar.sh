#!/bin/bash
#
# Script centralizado de publicación EMEDOTEME
# Ejecuta todos los pasos y deja logs detallados bajo logs/emedoteme.log
#
# Para adaptar/añadir redes, edita aquí. Requiere un .env completo.

set -euo pipefail

# [Propuesta 1] Cambiar a ruta relativa para mayor portabilidad
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

# === Logging de inicio ===
echo -e "\n================== 📰 PUBLICAR.sh ($TIMESTAMP) =================="

# === Paso 1: Generar artículo principal ===
echo "[1️⃣] Generando artículo principal con scripts/publish.ts..."
if npx tsx scripts/publish.ts 2>&1; then
  
  echo "[✅] Paso 1 completado exitosamente."

  # [Propuesta 3] Verificar si el JSON generado existe antes de publicar en redes
  if [ ! -f "$JSON_PATH" ]; then
    echo "❌ Error: No se encontró $JSON_PATH tras la generación."
    exit 1
  fi

  echo "[📦] Metadata detectada en $JSON_PATH. Iniciando publicación en redes..."

  # [Propuesta 4] Ejecución de scripts con python3
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
  echo "❌ Error al generar el artículo. Abortando publicación en redes."
  exit 1
fi

echo -e "\n✅ Proceso completado. Revisa tus redes sociales. ($TIMESTAMP)\n"
echo "==============================================================="
