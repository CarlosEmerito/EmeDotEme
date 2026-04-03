#!/bin/bash

PID_FILE="/home/emerito/emedoteme/bot.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    echo "Deteniendo el bot automático de EmeDotEme (PID: $PID)..."
    
    # Detener el proceso
    kill $PID 2>/dev/null
    
    # Eliminar el archivo de ID
    rm "$PID_FILE"
    echo "✅ Bot detenido correctamente."
else
    echo "❌ No se encontró ningún bot en ejecución."
fi