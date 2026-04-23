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
    -   `500 Internal Server Error`: Error en la base de datos.

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

---

## 🛠️ Notas Técnicas

### Rate Limiting
Actualmente, el rate limiting se gestiona a nivel de infraestructura en Vercel.

### Seguridad
Los endpoints que modifican datos o disparan procesos pesados requieren autenticación mediante tokens definidos en las variables de entorno (`CRON_SECRET`).
