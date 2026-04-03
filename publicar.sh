#!/bin/bash

# Hacemos la petición localmente pero guardando directo en la DB de producción
# Esto evita por completo el límite de tiempo de espera (Timeout) de Vercel y muestra todos los logs!

cd /home/emerito/emedoteme || exit

# Ejecutar el script y mostrar todos los logs
npx tsx scripts/publish.ts

echo ""
echo "====================================================="
echo "✅ PROCESO TERMINADO ✅"
echo "Revisa tu web para ver la noticia."
echo "====================================================="
