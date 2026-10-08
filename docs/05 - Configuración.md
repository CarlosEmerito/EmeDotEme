# Configuración de EmeDotEme

## Variables de entorno

### Base de datos

| Variable       | Descripción                                                   | Requerido |
|----------------|---------------------------------------------------------------|-----------|
| `DATABASE_URL` | URL de conexión principal (con pooler si aplica)              | ✅         |
| `DIRECT_URL`   | URL de conexión directa a la base de datos (para migraciones)  | ✅         |

### Autenticación del panel admin

| Variable          | Descripción                                                                                   | Requerido      |
|-------------------|------------------------------------------------------------------------------------------------|----------------|
| `ADMIN_PASSWORD`  | Contraseña del panel `/admin`                                                                  | ✅              |
| `SESSION_SECRET`  | Secreto para firmar las cookies de sesión. Debe ser un valor aleatorio independiente de `ADMIN_PASSWORD` (ej: `openssl rand -hex 32`). Si se omite, se reutiliza `ADMIN_PASSWORD` como fallback (se avisa por log) — ver [[10 - Seguridad y Prompts de IA]]. | Recomendado ✅ |

### IA - Gemini

| Variable           | Descripción                                 | Requerido    | Obtención |
|--------------------|---------------------------------------------|--------------|-----------|
| `GEMINI_API_KEY`   | Clave API de Gemini (primaria)              | ✅           | [Google AI Studio](https://aistudio.google.com/) |
| `GEMINI_API_KEY_2` | Clave secundaria (fallback)                 | Recomendado  | |
| `GEMINI_API_KEY_3` | Clave terciaria (fallback)                  | Recomendado  | |

### IA - Imágenes (generación y archivo)

| Variable                 | Descripción                                                        | Requerido | Obtención |
|--------------------------|--------------------------------------------------------------------|-----------|-----------|
| `CLOUDFLARE_ACCOUNT_ID`  | ID de la cuenta de Cloudflare para Workers AI                       | Recomendado | Panel de Cloudflare → Workers AI |
| `CLOUDFLARE_API_TOKEN`   | Token con permiso **Workers AI: Read**                              | Recomendado | [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) |
| `PIXABAY_API_KEY`        | Clave de la API de Pixabay (fotografía de archivo con licencia)     | Recomendado | [Pixabay API](https://pixabay.com/api/docs/) |

> Ninguna de estas variables es obligatoria para que el pipeline funcione: si falta alguna, se salta ese escalón de la cascada. El artículo se guarda igualmente como borrador.
>
> `HF_TOKEN` ya no se usa.

### Imágenes - Supabase Storage (StorageService)

| Variable                   | Descripción                          | Requerido   | Obtención |
|----------------------------|--------------------------------------|-------------|-----------|
| `SUPABASE_URL`             | URL del proyecto                     | ✅           | [Supabase Console](https://supabase.com/dashboard/) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública (para `next.config.js`)  | Recomendado | Misma que `SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY`| Clave de servicio (admin)            | ✅           | |

### Telegram (Notificaciones, Canal y Aprobación)

| Variable                  | Descripción                                                        | Requerido |
|---------------------------|--------------------------------------------------------------------|-----------|
| `TELEGRAM_TOKEN`          | Token del bot de Telegram                                          | ✅         |
| `TELEGRAM_CHAT_ID`        | Chat ID del dueño: recibe las peticiones de aprobación y es el único chat autorizado a aprobar borradores | ✅ |
| `TELEGRAM_CHANNEL_ID`     | Chat ID del canal público donde se anuncian las noticias           | ✅         |
| `TELEGRAM_WEBHOOK_SECRET` | Opcional. `secret_token` del webhook; si se define, se exige la cabecera `X-Telegram-Bot-Api-Secret-Token` | Opcional |

### Revisión editorial

| Variable    | Descripción                                                       | Requerido |
|-------------|-------------------------------------------------------------------|-----------|
| `SITE_URL`  | URL base para construir el enlace privado del borrador (`/preview/<token>`). Por defecto `https://www.emedoteme.es` | Opcional |

### Bluesky (Publicación)

| Variable           | Descripción                                                | Requerido | Obtención |
|--------------------|------------------------------------------------------------|-----------|-----------|
| `BLUESKY_HANDLE`   | Identificador de usuario de Bluesky (ej. `emedoteme.bsky.social`) | ✅         | |
| `BLUESKY_PASSWORD` | Contraseña o App Password de Bluesky                       | ✅         | Settings > App passwords |

### Binance Square (Publicación)

| Variable                 | Descripción                                                | Requerido | Obtención |
|--------------------------|------------------------------------------------------------|-----------|-----------|
| `BINANCE_SQUARE_API_KEY` | Clave OpenAPI para publicar artículos en Binance Square    | ✅         | Binance Developer Panel |

### Resend (Newsletters)

| Variable           | Descripción                      | Requerido   | Obtención |
|--------------------|----------------------------------|-------------|-----------|
| `RESEND_API_KEY`   | Clave API para enviar correos    | Opcional    | [Resend](https://resend.com/) |

### Rate limiting distribuido (Opcional, recomendado en producción)

Si no se configura, el rate limit usa memoria local (no válido en serverless).

| Variable                     | Descripción                       | Requerido | Obtención |
|------------------------------|-----------------------------------|-----------|-----------|
| `UPSTASH_REDIS_REST_URL`     | URL REST de la base Redis         | Opcional  | [Upstash](https://upstash.com/) |
| `UPSTASH_REDIS_REST_TOKEN`   | Token REST de la base Redis       | Opcional  | [Upstash](https://upstash.com/) |

> También se aceptan las variables de Vercel KV: `KV_REST_API_URL` / `KV_REST_API_TOKEN`.

---

## Dónde vive cada variable

El pipeline y la web son dos entornos distintos:

- **GitHub Actions** (secrets del repositorio): ejecuta `publicar.sh`. Necesita `DATABASE_URL`, `DIRECT_URL`, las claves de Gemini, las de imagen, `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_TOKEN`/`TELEGRAM_CHAT_ID`/`TELEGRAM_CHANNEL_ID`, Bluesky, Binance Square y `RESEND_API_KEY`. El workflow las inyecta como variables de entorno (`generate-news.yml`).
- **Vercel** (variables de entorno del proyecto): sirve la web y las rutas API. El webhook y la página de revisión viven aquí, así que hacen falta `TELEGRAM_TOKEN` y `TELEGRAM_CHAT_ID` (y, si se usa, `TELEGRAM_WEBHOOK_SECRET`). `SITE_URL` es opcional.

---

## Secretos de imagen en GitHub Actions

> [!WARNING]
> **Problema conocido y comprobado.** En los secretos de GitHub del repositorio **no están definidos `PIXABAY_API_KEY` ni `CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_API_TOKEN`**. El workflow los referencia, pero al no existir el secreto el valor queda vacío, así que en cada ejecución de GitHub Actions los dos primeros escalones de la cascada se saltan y el artículo termina siempre con la imagen de reserva. Los logs muestran `Falta PIXABAY_API_KEY` y `Faltan CLOUDFLARE_ACCOUNT_ID o CLOUDFLARE_API_TOKEN`.

**Solución.** Crear las claves y añadirlas como secretos:

1. **Pixabay**: crear una cuenta gratuita en [pixabay.com](https://pixabay.com/api/docs/); la clave aparece al instante en la página de la API.
2. **Cloudflare**: obtener `CLOUDFLARE_ACCOUNT_ID` del panel (Workers AI) y crear un token con el permiso **Workers AI: Read** en [API Tokens](https://dash.cloudflare.com/profile/api-tokens).

```bash
gh secret set PIXABAY_API_KEY
gh secret set CLOUDFLARE_ACCOUNT_ID
gh secret set CLOUDFLARE_API_TOKEN
```

Sin `PIXABAY_API_KEY` la cascada no busca fotografía de archivo; sin las dos de Cloudflare no genera imágenes. Con ellas, la cascada funciona como se describe en [[04 - Flujos de Trabajo]].

---

## Archivo .env.example

```env
# === CORE APP ENVIRONMENT ===
DATABASE_URL=""
DIRECT_URL=""
CRON_SECRET=""
ADMIN_PASSWORD=""
SESSION_SECRET=""
SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
NEXT_PUBLIC_SUPABASE_URL=""
RESEND_API_KEY=""

# === RATE LIMITING DISTRIBUIDO (opcional) ===
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# === INTELIGENCIA ARTIFICIAL ===
GEMINI_API_KEY=""
GEMINI_API_KEY_2=""
GEMINI_API_KEY_3=""

# === IMÁGENES ===
CLOUDFLARE_ACCOUNT_ID=""
CLOUDFLARE_API_TOKEN=""
PIXABAY_API_KEY=""

# === TELEGRAM ===
TELEGRAM_TOKEN=""
TELEGRAM_CHAT_ID=""
TELEGRAM_CHANNEL_ID=""
TELEGRAM_WEBHOOK_SECRET=""

# === REVISIÓN EDITORIAL ===
SITE_URL="https://www.emedoteme.es"

# === BLUESKY ===
BLUESKY_HANDLE=""
BLUESKY_PASSWORD=""

# === BINANCE SQUARE ===
BINANCE_SQUARE_API_KEY=""
MAX_POST_CHARS=900
```

---

## Constantes del proyecto

### AI_PROMPTS
Ubicados en `config/prompts.ts`, centralizan la personalidad del periodista y las reglas de corrección.

### NEWS_SOURCES
Fuentes RSS configuradas en `modules/news/news-sources.service.ts`.

### FALLBACK_IMAGES
Pool de imágenes de reserva por categoría en `config/constants.ts`.

---

## Referencias

- [[02 - Stack Tecnológico]]
- [[03 - Módulos]]
- [[12 - Aprobación Editorial]]
