#!/bin/bash
# Script para arrancar la API de Flux.1 en Docker

CONTAINER_NAME="flux-api-server"

# Comprobar si ya está corriendo
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "✅ La IA ya está en ejecución."
    exit 0
fi

# Comprobar si existe pero está detenido
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "🔄 Reiniciando contenedor de IA existente..."
    docker start $CONTAINER_NAME
    exit 0
fi

echo "🚀 Arrancando Flux.1 API Local (Optimizado para 8GB)..."
# Ejecutamos en segundo plano (-d) y con nombre fijo para poder controlarlo
docker run -d --name $CONTAINER_NAME \
  --gpus all -p 8000:8000 \
  -e HF_TOKEN="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" \
  -e PYTORCH_CUDA_ALLOC_CONF="expandable_segments:True" \
  --restart unless-stopped \
  flux-api

echo "⏳ El servidor de IA se está iniciando en segundo plano."
echo "Puedes ver los logs con: docker logs -f $CONTAINER_NAME"
