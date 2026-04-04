#!/bin/bash

# Hacemos la petición localmente pero guardando logs
# Este script se ejecuta por cron todos los sábados a las 10:30 AM

cd /home/emerito/emedoteme || exit

echo "====================================================="
echo "📅 EJECUTANDO NEWSLETTER SEMANAL - $(date)"
echo "====================================================="

# Aseguramos que la ejecución sea REAL y no un DRY RUN
export DRY_RUN=false

npx tsx scripts/send_newsletter.ts

if [ $? -eq 0 ]; then
    echo "✅ Proceso de newsletter finalizado correctamente."
else
    echo "❌ Error al generar y enviar la newsletter."
fi
echo ""