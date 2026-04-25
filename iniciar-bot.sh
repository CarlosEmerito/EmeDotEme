#!/bin/bash

# Archivo donde guardaremos el identificador del proceso para poder detenerlo luego
PID_FILE="/home/emerito/emedoteme/bot.pid"
LOG_FILE="/home/emerito/emedoteme/logs/emedoteme.log"
DIR="/home/emerito/emedoteme"

# Asegurar que el directorio de logs existe
mkdir -p "$DIR/logs"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "⚠️ El bot automático ya está en ejecución (PID: $PID)."
        echo "Si deseas reiniciarlo, ejecuta ./detener-bot.sh primero."
        echo "Para ver la actividad actual usa: tail -f logs/bot.log"
        exit 1
    else
        echo "⚠️ Archivo PID encontrado pero proceso no está activo. Limpiando..."
        rm -f "$PID_FILE"
    fi
fi

echo "================================================="
echo "🤖 INICIANDO BOT AUTOMÁTICO DE EMEDOTEME 🤖"
echo "================================================="

# Iniciar la IA de imagen primero
./iniciar-imagen.sh

echo "El bot se ha iniciado en segundo plano."
echo "Generará y publicará noticias localmente usando Ollama."
echo "Se ejecutará cada 3-5 horas de forma aleatoria."
echo "Puedes cerrar esta terminal y seguirá funcionando."
echo ""
echo "Para detenerlo usa: ./detener-bot.sh"
echo "Para ver la actividad usa: tail -f logs/emedoteme.log"
echo "================================================="

# Bucle Infinito que corre en background
nohup bash -c "
cd '$DIR' || exit 1
while true; do
    echo \"----------------------------------------\" | tee -a '$LOG_FILE'
    echo \"[\$(date '+%Y-%m-%d %H:%M:%S')] 🤖 BOT: Iniciando ciclo de publicación...\" | tee -a '$LOG_FILE'
    
    # Llamamos al script de publicación y lo registramos en el log
    ./publicar.sh | tee -a "$LOG_FILE"
    
    # Generar espera aleatoria entre 10800 segundos (3h) y 18000 segundos (5h)
    ESPERA=\$(( (RANDOM % 7201) + 10800 ))
    
    # Calcular horas y minutos para el log
    HORAS=\$(( ESPERA / 3600 ))
    MINUTOS=\$(( (ESPERA % 3600) / 60 ))
    
    echo \"[\$(date '+%Y-%m-%d %H:%M:%S')] 💤 BOT: Durmiendo... Próxima publicación en \$HORAS horas y \$MINUTOS minutos.\" | tee -a '$LOG_FILE'
    
    sleep \$ESPERA
done
" > /dev/null 2>&1 &

# Guardamos el ID del proceso (PID) del comando nohup en segundo plano
echo $! > "$PID_FILE"
