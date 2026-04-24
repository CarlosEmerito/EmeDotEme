#!/bin/bash

PID_FILE="/home/emerito/emedoteme/bot.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    echo "Deteniendo el bot automático de EmeDotEme (PID: $PID)..."
    
    # Detener el proceso principal
    kill $PID 2>/dev/null
    
    # Limpieza agresiva de procesos colgados
    echo "Limpiando procesos zombis del bot..."
    pkill -f "scripts/publish.ts" 2>/dev/null
    pkill -f "tsx scripts/publish.ts" 2>/dev/null
    
    # 1. Matar procesos específicos del bot y pipeline
    echo "Buscando procesos de generación y publicación activos..."
    pkill -f "scripts/publish"
    pkill -f "scripts/python/publish"
    pkill -f "tsx scripts/"
    pkill -9 -f "bin/gemini" # Matar el proceso del agente si es necesario
    
    # 2. Detener el servidor de imágenes local
    echo "Apagando el servidor de imágenes Flux.1..."
    docker stop flux-api-server 2>/dev/null || echo "⚠️ El servidor de imágenes ya estaba apagado."

    # 3. Limpiar Ollama de la VRAM usando el modelo configurado
    echo "Liberando VRAM de Ollama (${OLLAMA_MODEL:-gemma4:26b})..."
    curl -s -X POST http://localhost:11434/api/generate -d "{\"model\": \"${OLLAMA_MODEL:-gemma4:26b}\", \"keep_alive\": 0}" > /dev/null
    curl -s -X POST http://localhost:11434/api/generate -d '{"model": "gemma4:e4b", "keep_alive": 0}' > /dev/null
    
    # 4. Eliminar el archivo de ID
    rm -f "$PID_FILE"
    echo "✅ Sistema totalmente liberado (Bot, Flux, Ollama y Procesos de publicación)."
else
    echo "❌ No se encontró ningún bot en ejecución."
fi