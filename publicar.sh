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
echo -e "\n================== 📰 PUBLICAR.sh ($TIMESTAMP) ==================" | tee -a "$LOGFILE"

# === Paso 1: Generar artículo principal ===
echo "[1️⃣] Generando artículo principal..." | tee -a "$LOGFILE"
if npx tsx scripts/publish.ts 2>&1 | tee -a "$LOGFILE"; then
  
  # [Propuesta 3] Verificar si el JSON generado existe antes de publicar en redes
  if [ ! -f "$JSON_PATH" ]; then
    echo "❌ Error: No se encontró $JSON_PATH tras la generación." | tee -a "$LOGFILE"
    exit 1
  fi

  # [Propuesta 4] Ejecución de scripts con python3
  echo -e "\n[2️⃣] Enviando a Binance Square..." | tee -a "$LOGFILE"
  python3 scripts/python/publish_direct.py "$JSON_PATH" 2>&1 | tee -a "$LOGFILE"

  echo -e "\n[3️⃣] Enviando a Telegram..." | tee -a "$LOGFILE"
  python3 scripts/python/publish_telegram.py "$JSON_PATH" 2>&1 | tee -a "$LOGFILE"

  echo -e "\n[4️⃣] Enviando a Bluesky..." | tee -a "$LOGFILE"
  python3 scripts/python/publish_bluesky.py "$JSON_PATH" 2>&1 | tee -a "$LOGFILE"
else
  echo "❌ Error al generar el artículo. Abortando publicación en redes." | tee -a "$LOGFILE"
  exit 1
fi

echo -e "\n✅ Proceso completado. Revisa tus redes sociales. ($TIMESTAMP)\n" | tee -a "$LOGFILE"
echo "===============================================================" | tee -a "$LOGFILE"
