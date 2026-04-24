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

    # Limpiar Ollama de la VRAM
    echo "Liberando VRAM de Ollama..."
    curl -s -X POST http://localhost:11434/api/generate -d '{"model": "llama3.1:8b", "keep_alive": 0}' > /dev/null
    curl -s -X POST http://localhost:11434/api/generate -d '{"model": "qwen3.5:9b", "keep_alive": 0}' > /dev/null
    
    # Eliminar el archivo de ID
    rm "$PID_FILE"
    echo "✅ Bot, Flux y Ollama liberados correctamente."
else
    echo "❌ No se encontró ningún bot en ejecución."
fi