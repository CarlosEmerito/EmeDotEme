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

### 1. Ninguna fuente de imagen supera el control de calidad

> [!WARNING]
> **Síntoma**: en los logs aparecen rechazos consecutivos (`[QA Pixabay N]`, `[QA Cloudflare]`, `[QA reserva]`) y el artículo termina publicándose con la imagen de reserva.

> [!TIP]
> **Solución**:
> - No es un fallo: la cascada está diseñada para **no perder nunca el artículo**. Si ves `Pipeline de imagen resuelto con la reserva`, el artículo se publicó con una imagen genérica de la categoría.
> - Revisa las variables de entorno. Si falta `CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_API_TOKEN` o `PIXABAY_API_KEY`, esos dos escalones se saltan sin más.
> - **Cloudflare: asignación diaria agotada** — el error incluye `4006: you have used up your daily free allocation of 10,000 neurons`. Se reinicia a las 00:00 UTC. Con ~2 artículos al día es muy improbable llegar al límite (~170 imágenes).
> - **Pixabay sin resultados** — la consulta se construye con la categoría y las palabras más significativas del titular. Si una categoría concreta falla siempre, revisa `buildStockQuery` en `modules/images/stock-image.service.ts`.
> - Si Gemini Vision falla de forma definitiva (cuota agotada en las tres claves), **todas** las candidatas serán rechazadas y se usará la reserva. Ese es el síntoma típico de un problema de cuotas de Gemini, no de imágenes.

### 2. Una candidata de imagen falla con "HTTP 403 al descargar imagen"
> [!WARNING]
> **Síntoma**: los logs muestran `Error descargando imagen para análisis: Error: HTTP 403 al descargar imagen`, y el pipeline pasa al siguiente candidato de la cascada (Pixabay → Cloudflare → reserva).

> [!TIP]
> **Causa**: muchos CDNs de medios (CNBC, Investing.com, etc.) aplican *hotlink-protection*: rechazan las descargas de imagen que no incluyan un `Referer` del propio sitio o que usen un `User-Agent` que no parezca un navegador.
> **Solución ya aplicada**: `analyzeImageWithGemini` (`modules/ai/gemini-vision.service.ts`) envía un `User-Agent` de navegador real y un header `Referer` derivado de la URL del artículo de origen (`NewsItem.link`, propagado desde `publisher.service.ts` y `publish_test.ts`). Esto resuelve la protección "naive" basada en esos headers.
> - Si el 403 persiste para una fuente concreta después de este cambio, probablemente el sitio usa un WAF/bot-management más avanzado (Cloudflare, Akamai) que bloquea por reputación de IP (p. ej. rangos de datacenter de GitHub Actions), no por headers — en ese caso no hay solución a nivel de headers; esa fuente caerá siempre a los escalones siguientes (Pixabay y generación).

### 3. Imágenes no se cargan en la web
> [!WARNING]
> **Síntoma**: Errores 404 o imágenes rotas en el frontend.

> [!TIP]
> **Solución**:
> - Verifica la configuración de tu Supabase Storage y que el bucket tenga permisos de acceso público de lectura.
> - Ejecuta `npx tsx scripts/test-upload.ts` para comprobar la conectividad de subida y lectura de Supabase Storage.

---

### 4. En GitHub Actions la imagen cae siempre a la reserva

> [!WARNING]
> **Síntoma**: en cada ejecución de GitHub Actions el log muestra `Falta PIXABAY_API_KEY` y/o `Faltan CLOUDFLARE_ACCOUNT_ID o CLOUDFLARE_API_TOKEN`, y el borrador termina siempre con la imagen de reserva.

> [!TIP]
> **Causa**: los secretos `PIXABAY_API_KEY`, `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_API_TOKEN` **no están definidos** en el repositorio de GitHub. El workflow los referencia, pero al no existir el secreto el valor queda vacío y los dos primeros escalones de la cascada se saltan.
> **Solución**: crearlos y añadirlos (ver [[05 - Configuración]]):
> ```bash
> gh secret set PIXABAY_API_KEY
> gh secret set CLOUDFLARE_ACCOUNT_ID
> gh secret set CLOUDFLARE_API_TOKEN
> ```
> Pixabay da la clave al instante con una cuenta gratuita; el token de Cloudflare necesita el permiso «Workers AI: Read».

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

## 📨 Aprobación editorial (Telegram)

### 1. El borrador no llega a Telegram
> [!WARNING]
> **Síntoma**: el pipeline termina pero no aparece el mensaje de aprobación.

> [!TIP]
> **Solución**:
> - Revisa `TELEGRAM_TOKEN` y `TELEGRAM_CHAT_ID`. Sin uno de los dos, `sendApprovalRequest` no envía nada y el enlace privado queda solo en el log.
> - Si `DRY_RUN=true`, la petición no se envía (se registra el enlace en el log).

### 2. Pulsar un botón no hace nada
> [!TIP]
> - Los botones solo funcionan desde el chat de `TELEGRAM_CHAT_ID`; desde otro chat responden «Este botón no es para ti».
> - El webhook debe estar registrado apuntando a `https://www.emedoteme.es/api/telegram/webhook` (ver [[12 - Aprobación Editorial]]).
> - Si `TELEGRAM_WEBHOOK_SECRET` está definido, el webhook registrado debe llevar el mismo `secret_token`; si no, el webhook responde 401.

---

## 🛠️ Herramientas de Diagnóstico

El proyecto incluye varios scripts para facilitar la depuración:

-   **`scripts/test-env.ts`**: Verifica que todas las variables de entorno necesarias estén presentes y tengan formatos válidos.
-   **`scripts/check-latest-article.ts`**: Muestra el JSON del último artículo generado para inspección manual.
-   **`scripts/test-upload.ts`**: Prueba la conectividad de subida y lectura de Supabase Storage.
