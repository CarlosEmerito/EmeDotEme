#!/bin/bash

# Archivo donde guardaremos el identificador del proceso para poder detenerlo luego
PID_FILE="/home/emerito/emedoteme/bot.pid"
LOG_FILE="/home/emerito/emedoteme/bot.log"

if [ -f "$PID_FILE" ]; then
    echo "⚠️ El bot automático ya está en ejecución."
    echo "Si deseas reiniciarlo, ejecuta ./detener-bot.sh primero."
    exit 1
fi

echo "================================================="
echo "🤖 INICIANDO BOT AUTOMÁTICO DE EMEDOTEME 🤖"
echo "================================================="
echo "El bot se ha iniciado en segundo plano."
echo "Publicará noticias en tu web cada 2-5 horas de forma aleatoria."
echo "Puedes cerrar esta terminal y seguirá funcionando."
echo ""
echo "Para detenerlo usa: ./detener-bot.sh"
echo "Para ver la actividad usa: tail -f bot.log"
echo "================================================="

# El bloque de abajo es el "Bucle Infinito" que corre en background
nohup bash -c '
while true; do
    echo "----------------------------------------" >> "'$LOG_FILE'"
    echo "[$(date "+%Y-%m-%d %H:%M:%S")] Lanzando publicación a Vercel..." >> "'$LOG_FILE'"
    
    # Llamamos al script que ya teníamos
    /home/emerito/emedoteme/publicar.sh >> "'$LOG_FILE'" 2>&1
    
    echo "[$(date "+%Y-%m-%d %H:%M:%S")] Publicación completada." >> "'$LOG_FILE'"
    
    # Generar espera aleatoria entre 7200 segundos (2h) y 18000 segundos (5h)
    ESPERA=$(( (RANDOM % 10801) + 7200 ))
    
    # Para loggear la cantidad de horas en el archivo
    HORAS=$(echo "scale=2; $ESPERA/3600" | bc)
    echo "[$(date "+%Y-%m-%d %H:%M:%S")] Bot durmiendo... Próxima publicación en $HORAS horas." >> "'$LOG_FILE'"
    
    # El sistema se pausa durante esas horas
    sleep $ESPERA
done
' > /dev/null 2>&1 &

# Guardamos el ID del proceso (PID) del comando nohup en segundo plano
echo $! > "$PID_FILE"