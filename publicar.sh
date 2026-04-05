#!/bin/bash
set -x  # Muestra cada comando ejecutado
set -o pipefail  # Fallar si algún comando en pipe falla

# Hacemos la petición localmente pero guardando directo en la DB de producción
# Esto evita por completo el límite de tiempo de espera (Timeout) de Vercel y muestra todos los logs!

cd /home/emerito/emedoteme || exit

echo "====================================================="
echo "1️⃣ GENERANDO ARTÍCULO PARA EMEDOTEME..."
echo "====================================================="
npx tsx scripts/publish.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "====================================================="
    echo "2️⃣ ENVIANDO A BINANCE SQUARE..."
    echo "====================================================="
    cd /home/emerito/BinanceSquare || exit
    export $(grep -v '^#' .env | xargs)
    python3 publish_direct.py /home/emerito/emedoteme/tmp/latest_article.json

    echo ""
    echo "====================================================="
    echo "3️⃣ ENVIANDO A TELEGRAM..."
    echo "====================================================="
    cd /home/emerito/TelegramNews || exit
    export $(grep -v '^#' .env | xargs)
    python3 publish_telegram.py /home/emerito/emedoteme/tmp/latest_article.json

    echo "====================================================="
    echo "4️⃣ ENVIANDO A BLUESKY..."
    echo "====================================================="
    cd /home/emerito/BlueskyNews || exit
    export $(grep -v '^#' .env | xargs)
    python3 publish_bluesky.py /home/emerito/emedoteme/tmp/latest_article.json

else
    echo "❌ Error al generar el artículo. Abortando publicación en redes."
    exit 1
fi

echo ""
echo "====================================================="
echo "✅ PROCESO COMPLETADO ✅"
echo "Revisa tu web para ver la noticia y tus redes sociales."
echo "====================================================="
