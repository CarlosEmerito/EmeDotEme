#!/bin/bash
set -x  # Muestra cada comando ejecutado
set -o pipefail  # Fallar si algún comando en pipe falla

# Script de PRUEBA: Genera todo por pantalla pero no sube nada a producción ni BD
# Manda la portada generada a tu Telegram Privado y muestra los logs completos

cd /home/emerito/emedoteme || exit

echo "====================================================="
echo "🧪 1️⃣ GENERANDO ARTÍCULO DE PRUEBA (NO DATABASE) ..."
echo "====================================================="
# Ejecutamos la versión de test del publicador
npx tsx scripts/publish_test.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "====================================================="
    echo "🧪 2️⃣ MOSTRANDO QUÉ SE PUBLICARÍA EN REDES SOCIALES..."
    echo "====================================================="
    
    echo -e "\n🔸 BINANCE SQUARE (Modo Prueba):"
    export $(grep -v '^#' .env | xargs)
    export DRY_RUN=true
    python3 publish_direct.py /home/emerito/emedoteme/tmp/test_article.json

    echo -e "\n🔸 TELEGRAM CANAL (Modo Prueba):"
    export $(grep -v '^#' .env | xargs)
    export DRY_RUN=true
    python3 publish_telegram.py /home/emerito/emedoteme/tmp/test_article.json

    echo -e "\n🔸 BLUESKY (Modo Prueba):"
    export $(grep -v '^#' .env | xargs)
    export DRY_RUN=true
    python3 publish_bluesky.py /home/emerito/emedoteme/tmp/test_article.json

    echo ""
    echo "====================================================="
    echo "📲 3️⃣ ENVIANDO IMAGEN A TU TELEGRAM PRIVADO..."
    echo "====================================================="
    export $(grep -v '^#' .env | xargs)
    # Ejecutamos el script de envío privado (usará el archivo de test)
    python3 send_private_test.py /home/emerito/emedoteme/tmp/test_article.json

else
    echo "❌ Error al generar el artículo de prueba. Abortando."
    exit 1
fi

echo ""
echo "====================================================="
echo "✅ PRUEBA COMPLETADA ✅"
echo "Revisa tu Telegram personal para ver la imagen generada."
echo "====================================================="
