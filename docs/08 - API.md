# Documentación de la API - EmeDotEme

Esta sección documenta los endpoints de la API interna utilizados por el frontend y los servicios de automatización.

## 🔓 Endpoints Públicos

### Suscripción al Newsletter
Permite a los usuarios suscribirse al boletín informativo semanal.

-   **URL**: `/api/subscribe`
-   **Método**: `POST`
-   **Cuerpo (JSON)**:
    ```json
    {
      "email": "usuario@ejemplo.com"
    }
    ```
-   **Respuestas**:
    -   `200 OK`: Suscrito correctamente o reactivado.
    -   `400 Bad Request`: Email inválido o ya suscrito.
    -   `429 Too Many Requests`: Se superó el límite de peticiones (5/minuto por IP).
    -   `500 Internal Server Error`: Error en la base de datos.

-   **Ejemplo cURL**:
    ```bash
    curl -X POST https://www.emedoteme.es/api/subscribe \
      -H "Content-Type: application/json" \
      -d '{"email": "usuario@ejemplo.com"}'
    ```

---

### Baja del Newsletter

Da de baja a un suscriptor. El enlace se genera por correo con un **token HMAC firmado** (`token`), de modo que no basta con conocer el email para darse de baja.

-   **URL**: `/api/unsubscribe`
-   **Método**: `GET`
-   **Parámetros de query**:
    -   `email`: email del suscriptor.
    -   `token`: firma HMAC-SHA256 del email (la genera `scripts/send_newsletter.ts`).
-   **Respuestas**:
    -   `200 OK`: Baja procesada (HTML).
    -   `400 Bad Request`: Falta el email o el token no es válido/caducado.
    -   `429 Too Many Requests`: Se superó el límite de peticiones (10/minuto por IP).

---

### Formulario de Contacto
Envía un mensaje de contacto al administrador del sitio.

-   **URL**: `/api/contact`
-   **Método**: `POST`
-   **Cuerpo (JSON)**:
    ```json
    {
      "name": "Nombre Usuario",
      "email": "usuario@ejemplo.com",
      "message": "Contenido del mensaje"
    }
    ```
-   **Respuestas**:
    -   `200 OK`: Mensaje enviado correctamente.
    -   `400 Bad Request`: Faltan campos o datos inválidos.
    -   `503 Service Unavailable`: Servicio de email no configurado.

-   **Ejemplo cURL**:
    ```bash
    curl -X POST https://www.emedoteme.es/api/contact \
      -H "Content-Type: application/json" \
      -d '{"name": "Juan", "email": "juan@ejemplo.com", "message": "Hola equipo"}'
    ```

---

## 🔒 Endpoints Protegidos

### Generación Automática de Artículos
Este endpoint dispara el pipeline completo de generación de un artículo a partir de fuentes RSS. Está diseñado para ser llamado por una tarea programada (Cron).

-   **URL**: `/api/generate`
-   **Método**: `GET`
-   **Cabeceras**:
    -   `Authorization`: `Bearer ${CRON_SECRET}`
-   **Funcionamiento**:
    1.  Verifica categorías base.
    2.  Obtiene noticias recientes vía RSS.
    3.  Llama al servicio de IA para redactar el artículo.
    4.  Asigna imagen (de la fuente o fallback).
    5.  Guarda en la base de datos y marca como publicado.
-   **Respuestas**:
    -   `201 Created`: Artículo generado con éxito.
    -   `401 Unauthorized`: Token de autorización inválido o ausente.
    -   `500 Internal Server Error`: Error en el pipeline.

-   **Ejemplo cURL**:
    ```bash
    curl -X GET https://www.emedoteme.es/api/generate \
      -H "Authorization: Bearer TU_CRON_SECRET"
    ```

---

## 🛠️ Notas Técnicas

### Rate Limiting

El rate limiting se aplica en `lib/rate-limit.ts`. Si se configuran `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (o `KV_REST_API_URL`/`KV_REST_API_TOKEN` de Vercel KV), usa un backend Redis distribuido, válido en entornos serverless/multinstancia. Si no, cae a un store en memoria (solo fiable en desarrollo). Se aplica a `/api/contact`, `/api/subscribe`, `/api/unsubscribe` y `/api/generate`.

### Seguridad

> [!WARNING]
> Los endpoints que modifican datos o disparan procesos pesados requieren autenticación mediante tokens definidos en las variables de entorno (`CRON_SECRET`). No expongas estos tokens en el cliente.
