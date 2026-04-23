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
| `GEMINI_MODEL`     | Modelo a usar (por defecto: gemini-2.5-flash)| Opcional     | |

### IA - Ollama (Local)

Para ejecución local. Requiere tener el software instalado de [ollama.com](https://ollama.com/).

| Variable           | Descripción                                 | Requerido | Default |
|--------------------|---------------------------------------------|-----------|---------|
| `OLLAMA_MODEL`     | Modelo (por defecto: llama3.1:8b)            | Opcional  | `llama3.1:8b` |
| `OLLAMA_BASE_URL`  | URL base                                    | Opcional  | `http://localhost:11434` |

### Imágenes - AI Horde

| Variable             | Descripción                                | Requerido   | Obtención |
|----------------------|--------------------------------------------|-------------|-----------|
| `AI_HORDE_API_KEY`   | Clave API de AI Horde                      | Recomendado | [AI Horde](https://aihorde.net/register) |

### Imágenes - Supabase Storage

| Variable                   | Descripción                  | Requerido   | Obtención |
|----------------------------|------------------------------|-------------|-----------|
| `SUPABASE_URL`             | URL del proyecto             | Recomendado | [Supabase Console](https://supabase.com/dashboard/) |
| `SUPABASE_SERVICE_ROLE_KEY`| Clave de servicio (admin)    | Recomendado | |

### Newsletter - Resend

| Variable           | Descripción                                 | Requerido | Obtención |
|--------------------|---------------------------------------------|-----------|-----------|
| `RESEND_API_KEY`   | API Key para envío de emails                | Opcional  | [Resend.com](https://resend.com/overview) |

### Telegram (Notificaciones)

| Variable           | Descripción                      | Requerido   |
|--------------------|----------------------------------|-------------|
| `TELEGRAM_TOKEN`   | Token del bot                    | Recomendado |
| `TELEGRAM_CHAT_ID` | Chat ID para notificaciones      | Recomendado |

### Binance Square

| Variable                  | Descripción                  | Requerido |
|---------------------------|------------------------------|-----------|
| `BINANCE_SQUARE_API_KEY`  | API Key de Binance Square    | Opcional  |
| `BINANCE_SQUARE_SECRET`   | Secret de Binance Square     | Opcional  |
| `BINANCE_SQUARE_URL`      | URL de la API                | Opcional  |

### Web/Auth

| Variable           | Descripción                                 | Requerido |
|--------------------|---------------------------------------------|-----------|
| `NEXTAUTH_URL`     | URL de la app (ej: https://emedoteme.es)    | ✅        |
| `NEXTAUTH_SECRET`  | Secret para NextAuth                        | ✅        |
| `ADMIN_PASSWORD`   | Contraseña admin                            | ✅        |

### Newsletter

| Variable           | Descripción                                 | Requerido |
|--------------------|---------------------------------------------|-----------|
| `RESEND_API_KEY`   | API Key de Resend (envío de emails)         | Opcional  |
| `NEWSLETTER_FROM`  | Email remitente                             | Opcional  |

---

## Archivo .env.example

```env
# ===========================================
# BASE DE DATOS
# ===========================================
DATABASE_URL="postgresql://..."

# ===========================================
# GEMINI (IA - Texto)
# ===========================================
GEMINI_API_KEY="AIza..."
GEMINI_API_KEY_2=""
GEMINI_API_KEY_3=""

# ===========================================
# OLLAMA (IA Local - Fallback)
# ===========================================
# Modelo llama3.1:8b es el recomendado por su velocidad y balance
OLLAMA_MODEL="llama3.1:8b"

# ===========================================
# AI HORDE (Imágenes)
# ===========================================
AI_HORDE_API_KEY=""

# ===========================================
# SUPABASE (Storage)
# ===========================================
SUPABASE_URL="https://..."
SUPABASE_SERVICE_ROLE_KEY=""

# ===========================================
# TELEGRAM (Notificaciones)
# ===========================================
TELEGRAM_TOKEN=""
TELEGRAM_CHAT_ID=""

# ===========================================
# AUTH
# ===========================================
NEXTAUTH_URL="https://www.emedoteme.es"
NEXTAUTH_SECRET="random-secret-min-32-chars"
ADMIN_PASSWORD="change-me"

# ===========================================
# NEWSLETTER
# ===========================================
RESEND_API_KEY=""
```

---

## Prisma Schema

### Modelos

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Category {
  id        String    @id @default(uuid())
  name      String    @unique
  slug      String    @unique
  articles  Article[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Article {
  id          String   @id @default(uuid())
  title       String
  titleEn     String?
  slug        String   @unique
  summary     String?
  summaryEn   String?
  content     String
  contentEn   String?
  imageUrl    String?
  imageCaption String?
  sourceUrl   String?
  author      String   @default("EmeDotEme AI")
  published   Boolean  @default(false)
  isOriginal  Boolean  @default(false)
  tags        String[] @default([])
  sentiment   String   @default("Neutral ⚖️")
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([published, createdAt(sort: Desc)])
  @@index([categoryId])
  @@index([isOriginal])
}

model Subscriber {
  id        String   @id @default(uuid())
  email     String   @unique
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
}

model Setting {
  id        String   @id @default("global") // We only need one record, or we can use keys
  key       String   @unique
  value     String   @db.Text
  updatedAt DateTime @updatedAt
}
```

---

## Constantes del proyecto

### FALLBACK_IMAGES

Imágenes de stock por categoría cuando todo falla (ubicadas en `config/constants.ts`):

```typescript
const FALLBACK_IMAGES = {
  Tecnología: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475',
    // ...
  ],
  IA: [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995',
    // ...
  ],
  // ...
}
```

### NEWS_SOURCES

Fuentes RSS configuradas en `modules/news/news-sources.service.ts`.

---

## Referencias

- [[02 - Stack Tecnológico]]