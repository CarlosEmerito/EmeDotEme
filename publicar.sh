#!/bin/bash
#
# Script centralizado de publicación EMEDOTEME
# Ejecuta todos los pasos y deja logs detallados bajo logs/emedoteme.log
#
# Para adaptar/añadir redes, edita aquí y elige/comenta pasos. Requiere un .env completo.

set -euo pipefail
cd /home/emerito/emedoteme || exit 1

# === Cargar .env de forma robusta ===
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi
LOGFILE="logs/emedoteme.log"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"

# === Logging de inicio ===
echo -e "\n================== 📰 PUBLICAR.sh ($TIMESTAMP) ==================" | tee -a "$LOGFILE"

# === Paso 1: Generar artículo principal ===
echo "[1️⃣] Generando artículo principal..." | tee -a "$LOGFILE"
if npx tsx scripts/publish.ts 2>&1 | tee -a "$LOGFILE"; then
  echo -e "\n[2️⃣] Enviando a Binance Square..." | tee -a "$LOGFILE"
  python3 scripts/python/publish_direct.py tmp/latest_article.json 2>&1 | tee -a "$LOGFILE"

  echo -e "\n[3️⃣] Enviando a Telegram..." | tee -a "$LOGFILE"
  python3 scripts/python/publish_telegram.py tmp/latest_article.json 2>&1 | tee -a "$LOGFILE"

  echo -e "\n[4️⃣] Enviando a Bluesky..." | tee -a "$LOGFILE"
  python3 scripts/python/publish_bluesky.py tmp/latest_article.json 2>&1 | tee -a "$LOGFILE"
else
  echo "❌ Error al generar el artículo. Abortando publicación en redes." | tee -a "$LOGFILE"
  exit 1
fi

echo -e "\n✅ Proceso completado. Revisa tus redes sociales. ($TIMESTAMP)\n" | tee -a "$LOGFILE"
echo "===============================================================" | tee -a "$LOGFILE"
