# Configuración de EmeDotEme

## Variables de entorno

### Base de datos

| Variable         | Descripción                        | Requerido |
|------------------|------------------------------------|-----------|
| `DATABASE_URL`   | URL de PostgreSQL (Prisma)         | ✅        |

### IA - Gemini

| Variable           | Descripción                                 | Requerido    | Obtención |
|--------------------|---------------------------------------------|--------------|-----------|
| `GEMINI_API_KEY`   | Clave API de Gemini (primaria)              | ✅           | [Google AI Studio](https://aistudio.google.com/) |
| `GEMINI_API_KEY_2` | Clave secundaria (fallback)                 | Recomendado  | |
| `GEMINI_API_KEY_3` | Clave terciaria (fallback)                  | Recomendado  | |

### IA - Ollama (Local)

**IMPORTANTE**: No existen valores por defecto. Deben configurarse obligatoriamente para usar las funciones locales.

| Variable             | Descripción                                | Requerido | Ejemplo      |
|----------------------|--------------------------------------------|-----------|--------------|
| `OLLAMA_MODEL`       | Modelo para texto y corrección             | ✅         | `gemma4:26b` |
| `OLLAMA_VISION_MODEL`| Modelo para análisis de imágenes (Vision)  | ✅         | `gemma4:e4b` |

### Imágenes - Flux.1 Local

| Variable           | Descripción                                 | Requerido | Default |
|--------------------|---------------------------------------------|-----------|---------|
| `FLUX_API_URL`     | URL de la API local de Flux                 | Opcional  | `http://localhost:8000` |

### Imágenes - AI Horde

| Variable             | Descripción                                | Requerido   | Obtención |
|----------------------|--------------------------------------------|-------------|-----------|
| `AI_HORDE_API_KEY`   | Clave API de AI Horde                      | Recomendado | [AI Horde](https://aihorde.net/register) |

### Imágenes - Supabase Storage (StorageService)

| Variable                   | Descripción                  | Requerido   | Obtención |
|----------------------------|------------------------------|-------------|-----------|
| `SUPABASE_URL`             | URL del proyecto             | ✅           | [Supabase Console](https://supabase.com/dashboard/) |
| `SUPABASE_SERVICE_ROLE_KEY`| Clave de servicio (admin)    | ✅           | |

### Telegram (Notificaciones)

| Variable           | Descripción                      | Requerido   |
|--------------------|----------------------------------|-------------|
| `TELEGRAM_TOKEN`   | Token del bot                    | ✅           |
| `TELEGRAM_CHAT_ID` | Chat ID para notificaciones      | ✅           |

---

## Archivo .env.example (Actualizado)

```env
# ===========================================
# BASE DE DATOS
# ===========================================
DATABASE_URL="postgresql://..."

# ===========================================
# GEMINI (IA - Texto)
# ===========================================
GEMINI_API_KEY="AIza..."

# ===========================================
# OLLAMA (IA Local) - MANDATORIOS
# ===========================================
OLLAMA_MODEL="gemma4:26b"
OLLAMA_VISION_MODEL="gemma4:e4b"

# ===========================================
# AI HORDE (Imágenes Fallback)
# ===========================================
AI_HORDE_API_KEY=""

# ===========================================
# SUPABASE (Storage Permanente)
# ===========================================
SUPABASE_URL="https://..."
SUPABASE_SERVICE_ROLE_KEY=""

# ===========================================
# TELEGRAM (Notificaciones Críticas)
# ===========================================
TELEGRAM_TOKEN=""
TELEGRAM_CHAT_ID=""

# ===========================================
# AUTH & ADMIN
# ===========================================
NEXTAUTH_URL="https://www.emedoteme.es"
NEXTAUTH_SECRET="random-secret-min-32-chars"
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
