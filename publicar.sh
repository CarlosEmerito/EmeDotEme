#!/bin/bash

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
else
    echo "❌ Error al generar el artículo. Abortando publicación en Binance Square."
    exit 1
fi

echo ""
echo "====================================================="
echo "✅ PROCESO COMPLETADO ✅"
echo "Revisa tu web para ver la noticia y Binance Square para el post."
echo "====================================================="
