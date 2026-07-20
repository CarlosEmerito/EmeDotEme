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
> - La robustez de Gemini 2.5 suele ser alta, pero si un JSON viene incompleto el sistema cuenta con rutinas automáticas de reparación (`lib/json-sanitizer.ts`) para recuperar la información básica estructurada.

---

## 🖼️ Problemas con las Imágenes

### 1. Hugging Face (stable-diffusion-3-medium-diffusers) falla
> [!WARNING]
> **Síntoma**: El script indica que no se pudo generar la imagen mediante Hugging Face y se cancela la creación del artículo (no hay fallback de stock ni local: si la imagen del RSS es rechazada por QA y Hugging Face también falla, el pipeline lanza una excepción).

> [!TIP]
> **Solución**:
> - Asegúrate de que la variable `HF_TOKEN` en tu `.env` sea válida y no haya sido revocada.
> - **Créditos agotados (HTTP 402)**: `{"error":"You have depleted your monthly included credits..."}` — significa que se agotó la cuota mensual gratuita de Hugging Face Inference Providers, no un problema del código. Compra créditos prepago o suscríbete a PRO en [huggingface.co/settings/billing](https://huggingface.co/settings/billing), o espera al reset mensual.
> - Verifica si has alcanzado los límites de uso gratuito de la API de Hugging Face Serverless Inference.
> - Revisa si el modelo `stabilityai/stable-diffusion-3-medium-diffusers` sigue disponible en el proveedor `hf-inference` (consulta `GET https://huggingface.co/api/models?pipeline_tag=text-to-image&inference_provider=hf-inference`); Hugging Face cambia con frecuencia qué modelos sirve cada proveedor.

### 2. La imagen del RSS es rechazada con "HTTP 403 al descargar imagen"
> [!WARNING]
> **Síntoma**: En el paso `[QA RSS]` los logs muestran `Error descargando imagen para análisis: Error: HTTP 403 al descargar imagen`, y el pipeline pasa a intentar Hugging Face (con el riesgo de fallar también si no hay créditos, ver punto 1).

> [!TIP]
> **Causa**: muchos CDNs de medios (CNBC, Investing.com, etc.) aplican *hotlink-protection*: rechazan las descargas de imagen que no incluyan un `Referer` del propio sitio o que usen un `User-Agent` que no parezca un navegador.
> **Solución ya aplicada**: `analyzeImageWithGemini` (`modules/ai/gemini-vision.service.ts`) envía un `User-Agent` de navegador real y un header `Referer` derivado de la URL del artículo de origen (`NewsItem.link`, propagado desde `publisher.service.ts` y `publish_test.ts`). Esto resuelve la protección "naive" basada en esos headers.
> - Si el 403 persiste para una fuente concreta después de este cambio, probablemente el sitio usa un WAF/bot-management más avanzado (Cloudflare, Akamai) que bloquea por reputación de IP (p. ej. rangos de datacenter de GitHub Actions), no por headers — en ese caso no hay solución a nivel de headers; toca aceptar que esa fuente caerá siempre a Hugging Face.

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
