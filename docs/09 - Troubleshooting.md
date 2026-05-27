# Troubleshooting - EmeDotEme

Guía para identificar y solucionar problemas comunes en el sistema.

## 🔴 El Pipeline de Publicación falla

### 1. Error de cuota o alta demanda en Gemini
> [!WARNING]
> **Síntoma**: Los logs muestran `429 Too Many Requests` (cuota de peticiones superada) o errores `503 Service Unavailable / Model is overloaded` (alta demanda en servidores de Google).

> [!TIP]
> **Solución**: 
> - **Límites de Cuota (429):** Asegúrate de tener configuradas las claves de fallback (`GEMINI_API_KEY_2` y `GEMINI_API_KEY_3`) en el `.env`. El sistema rotará automáticamente a la siguiente clave.
> - **Alta Demanda (503 / Overloaded):** El sistema implementa reintentos exponenciales automáticos esperando **30, 60 y 120 segundos** para cada clave API. Si tras los 3 reintentos (3.5 minutos en total) sigue fallando, rotará a la siguiente clave API. Si el problema persiste en todas las claves, comprueba el panel de estado de Google Cloud o espera unos minutos.

### 2. Error en el parseo JSON de la IA
> [!WARNING]
> **Síntoma**: `SyntaxError: Unexpected token...` al procesar la respuesta de la IA.

> [!TIP]
> **Depuración**:
> - Al no usar Ollama local, la robustez de Gemini 2.5 suele ser alta, pero si un JSON viene incompleto el sistema cuenta con rutinas automáticas de reparación (`lib/json-sanitizer.ts`) para recuperar la información básica estructurada.

### 3. Ollama no responde (Opcional, local)
> [!NOTE]
> En la configuración actual orientada a Cloud/VPS, el uso local de Ollama es opcional. Si no está configurado, el sistema usará exclusivamente Gemini. Para entornos locales con GPU, configura `OLLAMA_MODEL` en tu `.env`.

---

## 🖼️ Problemas con las Imágenes

### 1. Hugging Face (FLUX.1-schnell) falla
> [!WARNING]
> **Síntoma**: El script indica que no se pudo generar la imagen mediante Hugging Face y se cancela la creación del artículo (ya que no hay fallback local ni de AI Horde).

> [!TIP]
> **Solución**:
> - Asegúrate de que la variable `HF_TOKEN` en tu `.env` sea válida y no haya sido revocada.
> - Verifica si has alcanzado los límites de uso gratuito de la API de Hugging Face Serverless Inference.
> - Revisa si el modelo `black-forest-labs/FLUX.1-schnell` está disponible en la página de estado de Hugging Face.

### 2. Flux.1 Local / AI Horde (Opcionales)
> [!NOTE]
> Para entornos sin GPU dedicada, la generación mediante Flux local y AI Horde es opcional. La generación de imágenes depende principalmente de la API Inference de Hugging Face (`HF_TOKEN`) o de la imagen original del feed RSS. Flux.1 local requiere Docker + GPU NVIDIA 8GB+ VRAM.

### 3. Imágenes no se cargan en la web
> [!WARNING]
> **Síntoma**: Errores 404 o imágenes rotas en el frontend.

> [!TIP]
> **Solución**:
> - Verifica la configuración de tu Supabase Storage y que el bucket tenga permisos de acceso público de lectura.
> - Ejecuta `npx tsx scripts/test-upload.ts` para comprobar la conectividad de subida y lectura de Supabase Storage.

---

## 💾 Base de Datos

### 1. Errores de conexión (Prisma)
> [!WARNING]
> **Síntoma**: `P1001: Can't reach database server`.

> [!TIP]
> **Solución**:
> - Verifica que la `DATABASE_URL` sea correcta y que la base de datos acepte conexiones externas.
> - Si usas Supabase, asegúrate de no estar superando el límite de conexiones.

---

## 📨 Newsletter y Contacto

### 1. Los emails no llegan
> [!WARNING]
> **Síntoma**: El proceso termina sin error pero no se reciben correos.

> [!TIP]
> **Solución**:
> - Verifica que has configurado correctamente la variable `RESEND_API_KEY` en el `.env`.
> - Verifica en el panel de **Resend** si los emails han sido rechazados o están en cola.
> - Asegúrate de que el dominio `emedoteme.es` esté verificado en Resend.

---

## 🛠️ Herramientas de Diagnóstico

El proyecto incluye varios scripts para facilitar la depuración:

-   **`scripts/test-env.ts`**: Verifica que todas las variables de entorno necesarias estén presentes y tengan formatos válidos.
-   **`scripts/check-latest-article.ts`**: Muestra el JSON del último artículo generado para inspección manual.
-   **`scripts/test-upload.ts`**: Prueba la conectividad de subida y lectura de Supabase Storage.
