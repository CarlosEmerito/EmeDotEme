# Troubleshooting - EmeDotEme

Guía para identificar y solucionar problemas comunes en el sistema.

## 🔴 El Pipeline de Publicación falla

### 1. Error de cuota en Gemini
**Síntoma**: Los logs muestran `429 Too Many Requests` o `Quota exceeded`.
**Solución**: 
- Asegúrate de tener configuradas las claves de fallback (`GEMINI_API_KEY_2`, etc.) en el `.env`.
- Verifica el panel de Google AI Studio para ver el consumo actual.

### 2. Error en el parseo JSON de la IA
**Síntoma**: `SyntaxError: Unexpected token...` al procesar la respuesta de la IA.
**Depuración**:
- Ejecuta `npx tsx scripts/diagnose-json-errors.ts` para ver qué está devolviendo la IA exactamente.
- Si el error persiste, Ollama suele ser más estricto con el formato; intenta ajustar el prompt en `modules/ai/`.

### 3. Ollama no responde
**Síntoma**: Timeout o `ECONNREFUSED` al intentar usar la IA local.
**Solución**:
- Verifica que Ollama esté corriendo: `curl http://localhost:11434`.
- Asegúrate de que el modelo configurado en `OLLAMA_MODEL` esté descargado: `ollama list`.

---

## 🖼️ Problemas con las Imágenes

### 1. Flux.1 Local: Cómo monitorizar el progreso
**Síntoma**: El pipeline parece congelado durante la generación de imagen.
**Explicación**: La generación de Flux en GPUs de 8GB es intensiva y puede tardar varios minutos (hasta 15-20 min en casos extremos).
**Solución**: 
- Abre una nueva terminal y ejecuta: `docker logs -f flux-api-server`.
- Verás el progreso paso a paso (ej: `Paso 4/28 (14.3%)`).

### 2. Flux.1 Local: Error de Memoria (CUDA Out of Memory)
**Síntoma**: El log de Docker muestra `CUDA out of memory` y la generación falla.
**Causas**: 
- Ollama o Gemini Vision están reteniendo memoria de la GPU.
- El handoff de memoria no ha tenido tiempo suficiente para limpiar los buffers.
**Solución**:
- El sistema utiliza `unloadOllamaModels()` con una pausa de 13 segundos antes de iniciar Flux. Si sigue fallando, prueba a limpiar manualmente la VRAM ejecutando `./detener-bot.sh`.
- Verifica que el contenedor de Flux se haya iniciado con `PYTORCH_CUDA_ALLOC_CONF="expandable_segments:True"` (lo hace automáticamente `iniciar-imagen.sh`).

### 3. AI Horde tarda demasiado o falla
**Síntoma**: El script se queda esperando o devuelve errores de servidor.
**Solución**:
- Es un servicio comunitario; a veces hay mucha carga. El sistema intentará automáticamente usar una imagen de stock (Unsplash) tras fallar los intentos locales por IA.
- Verifica si tu `AI_HORDE_API_KEY` tiene puntos de prioridad.

### 2. Imágenes no se cargan en la web
**Síntoma**: Errores 404 o imágenes rotas en el frontend.
**Solución**:
- Verifica la configuración de Supabase Storage.
- Ejecuta `npx tsx scripts/test-upload.ts` para comprobar la conectividad con el bucket.

---

## 💾 Base de Datos

### 1. Errores de conexión (Prisma)
**Síntoma**: `P1001: Can't reach database server`.
**Solución**:
- Verifica que la `DATABASE_URL` sea correcta y que la base de datos acepte conexiones externas.
- Si usas Supabase, asegúrate de no estar superando el límite de conexiones.

---

## 📨 Newsletter y Contacto

### 1. Los emails no llegan
**Síntoma**: El proceso termina sin error pero no se reciben correos.
**Solución**:
- Verifica en el panel de **Resend** si los emails han sido rechazados o están en cola.
- Asegúrate de que el dominio `emedoteme.es` esté verificado en Resend.

---

## 🛠️ Herramientas de Diagnóstico

El proyecto incluye varios scripts para facilitar la depuración:

-   **`scripts/test-env.ts`**: Verifica que todas las variables de entorno necesarias estén presentes y tengan formatos válidos.
-   **`scripts/test-ai-tags.ts`**: Prueba específicamente la generación de etiquetas por IA.
-   **`scripts/check-latest-article.ts`**: Muestra el JSON del último artículo generado para inspección manual.
