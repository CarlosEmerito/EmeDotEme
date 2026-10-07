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

### IA - Hugging Face (Imágenes)

| Variable   | Descripción                                            | Requerido | Obtención |
|------------|--------------------------------------------------------|-----------|-----------|
| `HF_TOKEN` | Token de Hugging Face para consumir FLUX.1-schnell | ✅         | [Hugging Face Settings](https://huggingface.co/settings/tokens) |

### Imágenes - Supabase Storage (StorageService)

| Variable                   | Descripción                          | Requerido   | Obtención |
|----------------------------|--------------------------------------|-------------|-----------|
| `SUPABASE_URL`             | URL del proyecto                     | ✅           | [Supabase Console](https://supabase.com/dashboard/) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública (para `next.config.js`)  | Recomendado | Misma que `SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY`| Clave de servicio (admin)            | ✅           | |

### Telegram (Notificaciones y Canal)

| Variable              | Descripción                                                        | Requerido |
|-----------------------|--------------------------------------------------------------------|-----------|
| `TELEGRAM_TOKEN`      | Token del bot de Telegram                                          | ✅         |
| `TELEGRAM_CHAT_ID`    | Chat ID de pruebas o notificaciones de error                       | ✅         |
| `TELEGRAM_CHANNEL_ID` | Chat ID del canal público donde se publican las noticias           | ✅         |

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

## Archivo .env.example (Actualizado)

```env
# === CORE APP ENVIRONMENT ===
DATABASE_URL=""
DIRECT_URL=""
CRON_SECRET=""
ADMIN_PASSWORD=""
SESSION_SECRET=""
SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
RESEND_API_KEY=""

# === RATE LIMITING DISTRIBUIDO (opcional) ===
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# === INTELIGENCIA ARTIFICIAL ===
GEMINI_API_KEY=""
GEMINI_API_KEY_2=""
GEMINI_API_KEY_3=""
HF_TOKEN=""

# === TELEGRAM ===
TELEGRAM_TOKEN=""
TELEGRAM_CHAT_ID=""
TELEGRAM_CHANNEL_ID=""

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

---

## Referencias

- [[02 - Stack Tecnológico]]
- [[03 - Módulos]]
