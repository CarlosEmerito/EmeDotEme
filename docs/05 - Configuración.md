# Configuración de EmeDotEme

## Variables de entorno

### Base de datos

| Variable         | Descripción                        | Requerido |
|------------------|------------------------------------|-----------|
| `DATABASE_URL`   | URL de PostgreSQL (Prisma)         | ✅        |

### IA - Gemini

| Variable           | Descripción                                 | Requerido    |
|--------------------|---------------------------------------------|--------------|
| `GEMINI_API_KEY`   | Clave API de Gemini (primaria)              | ✅           |
| `GEMINI_API_KEY_2` | Clave secundaria (fallback)                 | Recomendado  |
| `GEMINI_API_KEY_3` | Clave terciaria (fallback)                  | Recomendado  |
| `GEMINI_MODEL`     | Modelo a usar (por defecto: gemini-2.5-flash)| Opcional     |

### IA - Ollama (Local)

| Variable           | Descripción                                 | Requerido |
|--------------------|---------------------------------------------|-----------|
| `OLLAMA_MODEL`     | Modelo (por defecto: qwen3.5:9b)            | Opcional  |
| `OLLAMA_BASE_URL`  | URL base (por defecto: http://localhost:11434)| Opcional  |
| `OLLAMA_TIMEOUT`   | Timeout en ms (por defecto: 600000)         | Opcional  |

### Imágenes - AI Horde

| Variable             | Descripción                                | Requerido   |
|----------------------|--------------------------------------------|-------------|
| `AI_HORDE_API_KEY`   | Clave API de AI Horde                      | Recomendado |
| `AI_HORDE_ENDPOINT`  | Endpoint (por defecto: https://aihorde.net)| Opcional    |

### Imágenes - Supabase Storage

| Variable                   | Descripción                  | Requerido   |
|----------------------------|------------------------------|-------------|
| `SUPABASE_URL`             | URL del proyecto Supabase    | Recomendado |
| `SUPABASE_SERVICE_ROLE_KEY`| Clave de servicio (admin)    | Recomendado |

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
OLLAMA_MODEL="qwen3.5:9b"

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
model Article {
  id          String   @id @default(cuid())
  title       String
  titleEn     String?
  slug        String   @unique
  summary     String
  summaryEn   String?
  content     String
  contentEn   String?
  tags        String[]
  imageUrl    String
  imageCaption String?
  sourceUrl   String?
  isOriginal  Boolean  @default(false)
  sentiment   String   @default("Neutral ➡️")
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  author      String   @default("Carlos 'Emérito' López Lovera")
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([slug])
  @@index([categoryId])
  @@index([published])
}

model Category {
  id        String    @id @default(cuid())
  name      String    @unique
  slug      String    @unique
  articles  Article[]
}

model Subscriber {
  id        String   @id @default(cuid())
  email     String   @unique
  confirmed Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Analytic {
  id        String   @id @default(cuid())
  articleId String
  views     Int      @default(0)
  date      DateTime @default(now())
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