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

### 1. AI Horde tarda demasiado o falla
**Síntoma**: El script se queda esperando o devuelve errores de servidor.
**Solución**:
- Es un servicio comunitario; a veces hay mucha carga. El sistema intentará automáticamente usar una imagen de stock (Unsplash) tras fallar los intentos por IA.
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
