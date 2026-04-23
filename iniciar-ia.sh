#!/bin/bash
echo "🚀 Arrancando Flux.1 API Local (Optimizado para 8GB)..."
docker run --gpus all -p 8000:8000 \
  -e HF_TOKEN="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" \
  -e PYTORCH_CUDA_ALLOC_CONF="expandable_segments:True" \
  flux-api
