#!/bin/bash

PID_FILE="/home/emerito/emedoteme/bot.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    echo "Deteniendo el bot automático de EmeDotEme (PID: $PID)..."
    
    # Detener el proceso
    kill $PID 2>/dev/null
    
    # Detener el servidor de imágenes local
    echo "Apagando el servidor de imágenes Flux.1..."
    docker stop flux-api-server 2>/dev/null || echo "⚠️ El servidor de imágenes ya estaba apagado."

    # Eliminar el archivo de ID
    rm "$PID_FILE"
    echo "✅ Bot e IA detenidos correctamente."
else
    echo "❌ No se encontró ningún bot en ejecución."
fi