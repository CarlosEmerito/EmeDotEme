#!/bin/bash

echo "====================================================="
echo "🚀 INICIANDO GENERACIÓN DE ARTÍCULO EN EMEDOTEME 🚀"
echo "====================================================="
echo ""
echo "Llamando al servidor de producción (Vercel) para que genere"
echo "y publique una nueva noticia usando tu Ollama local..."
echo ""

# Hacemos la petición a tu web de producción pasando el secreto
curl -s -X GET -H "Authorization: Bearer Fl0KODY2P+tM5ePcLwp4xViO6+HeklnqR3QGQG2iUD0=" https://eme-dot-eme.vercel.app/api/generate | jq .

echo ""
echo "====================================================="
echo "✅ PROCESO TERMINADO ✅"
echo "Revisa https://eme-dot-eme.vercel.app para ver la noticia."
echo "====================================================="

# Esto pausa la consola para que no se cierre sola si le haces doble clic
read -p "Presiona Enter para salir..."
