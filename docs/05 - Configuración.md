# Configuración de EmeDotEme

## Variables de entorno

### Base de datos

| Variable       | Descripción                                                   | Requerido |
|----------------|---------------------------------------------------------------|-----------|
| `DATABASE_URL` | URL de conexión principal (con pooler si aplica)              | ✅         |
| `DIRECT_URL`   | URL de conexión directa a la base de datos (para migraciones)  | ✅         |

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

### IA - Ollama (Desactivado en Cloud)

| Variable             | Descripción                                | Requerido | Ejemplo      |
|----------------------|--------------------------------------------|-----------|--------------|
| `OLLAMA_MODEL`       | Modelo para texto y corrección (Inactivo)  | ❌         | `gemma4:26b` |
| `OLLAMA_VISION_MODEL`| Modelo para análisis visual (Inactivo)     | ❌         | `gemma4:e4b` |

### Imágenes - Flux.1 Local (Desactivado en Cloud)

| Variable           | Descripción                                 | Requerido | Default |
|--------------------|---------------------------------------------|-----------|---------|
| `FLUX_API_URL`     | URL de la API local de Flux (Inactivo)      | ❌         | `http://localhost:8000` |

### Imágenes - AI Horde (Desactivado en Cloud)

| Variable             | Descripción                                | Requerido   | Obtención |
|----------------------|--------------------------------------------|-------------|-----------|
| `AI_HORDE_API_KEY`   | Clave API de AI Horde (Inactivo)           | ❌           | [AI Horde](https://aihorde.net/register) |

### Imágenes - Supabase Storage (StorageService)

| Variable                   | Descripción                  | Requerido   | Obtención |
|----------------------------|------------------------------|-------------|-----------|
| `SUPABASE_URL`             | URL del proyecto             | ✅           | [Supabase Console](https://supabase.com/dashboard/) |
| `SUPABASE_SERVICE_ROLE_KEY`| Clave de servicio (admin)    | ✅           | |

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

---

## Archivo .env.example (Actualizado)

```env
# ===========================================
# BASE DE DATOS
# ===========================================
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# ===========================================
# GEMINI (IA - Texto)
# ===========================================
GEMINI_API_KEY="AIza..."
GEMINI_API_KEY_2=""
GEMINI_API_KEY_3=""

# ===========================================
# HUGGING FACE (IA - Imágenes)
# ===========================================
HF_TOKEN="hf_..."

# ===========================================
# SUPABASE (Storage Permanente)
# ===========================================
SUPABASE_URL="https://..."
SUPABASE_SERVICE_ROLE_KEY=""

# ===========================================
# TELEGRAM (Notificaciones y Canal)
# ===========================================
TELEGRAM_TOKEN=""
TELEGRAM_CHAT_ID=""
TELEGRAM_CHANNEL_ID=""

# ===========================================
# BLUESKY
# ===========================================
BLUESKY_HANDLE=""
BLUESKY_PASSWORD=""

# ===========================================
# BINANCE SQUARE
# ===========================================
BINANCE_SQUARE_API_KEY=""

# ===========================================
# RESEND (Newsletters)
# ===========================================
RESEND_API_KEY=""

# ===========================================
# AUTH & ADMIN
# ===========================================
ADMIN_PASSWORD="change-me"
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
