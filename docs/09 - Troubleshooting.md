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
> - Ejecuta `npx tsx scripts/diagnose-json-errors.ts` para ver qué está devolviendo la IA exactamente.
> - Al no usar Ollama local, la robustez de Gemini 2.5 suele ser alta, pero si un JSON viene incompleto el sistema cuenta con rutinas automáticas de reparación de emergencia para recuperar la información básica estructurada.

### 3. Ollama no responde (Desactivado en Cloud)
> [!NOTE]
> En la configuración actual orientada a Cloud VPS, el uso local de Ollama está **desactivado**. Por lo tanto, este error no debería ocurrir a menos que vuelvas a habilitar los servicios locales descomentando el código en `ai.service.ts`.

---

## 🖼️ Problemas con las Imágenes

### 1. Hugging Face falla — error HTTP 410 (modelo deprecado)
> [!WARNING]
> **Síntoma**: `Error HTTP 410: The requested model is deprecated and no longer supported by provider hf-inference`

> [!TIP]
> **Solución**: El sistema prueba automáticamente tres modelos en cascada:
> 1. `black-forest-labs/FLUX.1-schnell` (preferido — gratuito)
> 2. `stabilityai/stable-diffusion-3.5-medium` (fallback)
> 3. `Lykon/dreamshaper-8` (fallback de emergencia)
>
> Si los tres fallan, el artículo **no se publica**. Actualiza la lista `HF_MODELS` en `modules/ai/hf-image.service.ts` con modelos activos.

### 2. Hugging Face falla — error HTTP 402 (sin créditos)
> [!WARNING]
> **Síntoma**: `Error HTTP 402: You have depleted your monthly included credits`

> [!TIP]
> **Solución**:
> - El tier gratuito de HuggingFace tiene un límite mensual de Inference Providers.
> - Verifica el uso en [huggingface.co/settings/billing](https://huggingface.co/settings/billing).
> - Considera rotar a otro modelo de la lista `HF_MODELS` que use un proveedor diferente.

### 3. Flux.1 Local / AI Horde (Desactivados en Cloud)
> [!NOTE]
> Para optimizar el despliegue en un entorno VPS sin tarjeta gráfica dedicada, la generación mediante Flux local, Ollama Vision y los fallbacks de AI Horde comunitarios han sido **completamente desactivados y comentados en el pipeline**. La generación de imágenes depende exclusivamente de la API Inference de Hugging Face o de la imagen original del feed RSS.

### 4. Imágenes no se cargan en la web
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

## 🔖 Publicación en Redes Sociales

### 1. Hashtags incorrectos o faltantes
> [!WARNING]
> **Síntoma**: Los posts aparecen sin hashtags o solo con `#EmeDotEme`.

> [!TIP]
> **Solución**:
> - Verifica que el artículo tenga `tags` en la base de datos (columna `articleTags` en Prisma).
> - Comprueba que `tmp/latest_article.json` contenga la clave `tags` con un array no vacío.
> - La función `format_hashtags()` en `social_publish_utils.py` es la que convierte los tags a hashtags.

### 2. Error de Prisma al ejecutar `npx prisma db push`
> [!WARNING]
> **Síntoma**: `Error: Environment variable not found: DIRECT_URL`

> [!TIP]
> **Solución**: Asegúrate de que el secret `DIRECT_URL` esté configurado en GitHub → Settings → Secrets and variables → Actions. Supabase requiere dos URLs distintas: una con pooler (`DATABASE_URL`) y otra directa (`DIRECT_URL`).

---

## 🛠️ Herramientas de Diagnóstico

El proyecto incluye varios scripts para facilitar la depuración:

-   **`scripts/test-env.ts`**: Verifica que todas las variables de entorno necesarias estén presentes y tengan formatos válidos.
-   **`scripts/test-ai-tags.ts`**: Prueba específicamente la generación de etiquetas por IA.
-   **`scripts/check-latest-article.ts`**: Muestra el JSON del último artículo generado para inspección manual.
