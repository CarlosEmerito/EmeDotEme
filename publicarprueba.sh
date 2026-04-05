#!/bin/bash
#
# Script de prueba centralizado EMEDOTEME
# Simula todo el workflow y deja logs bajo logs/emedoteme.log.
# Nada se sube a producción; todo es MODO PRUEBA.

set -euo pipefail
cd /home/emerito/emedoteme || exit 1

# === Cargar .env de forma robusta ===
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi
export DRY_RUN=true
LOGFILE="logs/emedoteme.log"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"

echo -e "\n================= 🧪 PUBLICARPRUEBA.sh ($TIMESTAMP) ==================" | tee -a "$LOGFILE"

# === Paso 1: Generar el artículo de prueba (NO BD) ===
echo "[1️⃣] Generando artículo de prueba..." | tee -a "$LOGFILE"
if npx tsx scripts/publish_test.ts 2>&1 | tee -a "$LOGFILE"; then
  echo -e "\n[2️⃣] Mostrando qué se publicaría en redes sociales (modo prueba)..." | tee -a "$LOGFILE"
  echo -e "\n🔸 Binance Square (Modo Prueba):" | tee -a "$LOGFILE"
  python3 publish_direct.py tmp/test_article.json 2>&1 | tee -a "$LOGFILE"

  echo -e "\n🔸 Telegram Canal (Modo Prueba):" | tee -a "$LOGFILE"
  python3 publish_telegram.py tmp/test_article.json 2>&1 | tee -a "$LOGFILE"

  echo -e "\n🔸 Bluesky (Modo Prueba):" | tee -a "$LOGFILE"
  python3 publish_bluesky.py tmp/test_article.json 2>&1 | tee -a "$LOGFILE"

  echo -e "\n[3️⃣] Enviando imagen generada a tu Telegram privado..." | tee -a "$LOGFILE"
  python3 send_private_test.py tmp/test_article.json 2>&1 | tee -a "$LOGFILE"
else
  echo "❌ Error al generar el artículo de prueba. Abortando." | tee -a "$LOGFILE"
  exit 1
fi

echo -e "\n✅ PRUEBA COMPLETADA. Revisa tu Telegram personal para ver la imagen. ($TIMESTAMP)\n" | tee -a "$LOGFILE"
echo "===============================================================" | tee -a "$LOGFILE"
