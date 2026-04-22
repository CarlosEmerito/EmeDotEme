# Módulos EmeDotEme

## Índice de Módulos

- [[Módulos#News Sources Module|News Sources]]
- [[Módulos#AI Module|AI]]
- [[Módulos#Articles Module|Articles]]
- [[Módulos#Images Module|Images]]
- [[Módulos#Newsletter Module|Newsletter]]
- [[Módulos#Market Module|Market]]

---

## News Sources Module

**Ubicación**: `modules/news/`

### Funcionalidad
- Fetch de noticias desde fuentes RSS fiables
- Deduplicación y clustering de noticias
- Filtrado de artículos recientes

### Archivos Clave

| Archivo | Descripción |
|---------|------------|
| `news-sources.service.ts` | Servicio principal de fetch RSS |

### Fuentes Configuradas

```
The Hacker News    → Ciberseguridad (alta fiablidad)
Krebs on Security → Ciberseguridad (alta fiabilidad)
Security Affairs  → Ciberseguridad (media fiabilidad)
CoinDesk         → Criptomonedas (alta fiabilidad)
MIT Technology Review AI → IA (alta fiabilidad)
Decrypt          → Criptomonedas (alta fiabilidad)
VentureBeat AI   → IA (alta fiabilidad)
El País Tecnología → Tecnología (media fiabilidad)
```

###API

```typescript
// Fetch noticias principales
fetchLatestNews(recentTitles, recentSourceUrls): Promise<FetchedNewsContext>

// Tipos
interface FetchedNewsContext {
  newsItems: NewsItem[]
  topicClusters: NewsItem[][]
  totalFetched: number
  sourcesResponded: string[]
}
```

### Dependencias
- **rss-parser**: Para parsear feeds RSS
- **dotenv**: Configuración

### Referencias
- [[Flujo de Publicación]] → Consumido por: [[Módulos#AI Module|AI Service]]

---

## AI Module

**Ubicación**: `modules/ai/`

### Funcionalidad
- Generación de artículos con IA (Gemini/Ollama)
- Post-procesado ortográfico
- Análisis de imágenes (Vision)
- Generación de imágenes (AI Horde)

### Sub-módulos

| Servicio | Archivo | Función |
|----------|---------|---------|
| AI Service | `ai.service.ts` | Orquestación principal |
| Gemini Text | `gemini-text.service.ts` | Generación de texto (API) |
| Gemini Vision | `gemini-vision.service.ts` | QA de imágenes |
| Ollama | `ai.service.ts` | Fallback local |
| Ollama Vision | `ollama-vision.service.ts` | QA fallback |
| AI Horde | `aihorde-image.service.ts` | Generación de imágenes |

### Flujo de Generación

```
1. generateArticleContent(recentTitles, newsItems)
   │
   ├──▶ Intentar Gemini API
   │      └─▶ Si falla → Ollama local
   │              └─▶ Si falla → Artículo de ejemplo
   │
   2. translateArticleContent()
      └─▶ Añade campos *_en
   │
   3. postprocessWithOllama()
      └─▶ Corrige mayúsculas
```

### API Principal

```typescript
// Generar artículo desde noticias
generateArticleContent(
  recentTitles: string[],
  newsContext: NewsItem[]
): Promise<GeneratedArticle>

// Interfaz de respuesta
interface GeneratedArticle {
  title: string
  summary: string
  content: string
  imagePrompt: string
  tags: string[]
  sourceUrl?: string
  sources?: string[]
  imageCaption?: string
  category?: string
}
```

### Estrategias de Fallback

1. **Texto**: Gemini → Ollama local → Artículo estático de ejemplo
2. **Imágenes**: RSS Source → AI Horde x2 → Unsplash Stock
3. **QA**: Gemini Vision → Ollama Vision

### Dependencias
- **@google/generative-ai**: Gemini API
- **node-fetch**: LLamadas HTTP
- **dotenv**: Configuración

### Referencias
- Consumido por: [[Módulos#News Sources Module|News Sources]]
- Produce: [[Módulos#Articles Module|Articles]]

---

## Articles Module

**Ubicación**: `modules/articles/`

### Funcionalidad
- Gestión de artículos en la base de datos
- Búsqueda y filtrado
- Categorías y tags

### API

```typescript
// Obtener artículos publicados
getPublishedArticles(limit, skip): Promise<Article[]>

// Por slug
getArticleBySlug(slug): Promise<Article>

// Relacionados
getRelatedArticles(categoryId, articleId, limit)

// Por categoría
getArticlesByCategorySlug(slug, limit, skip)

// Búsqueda avanzada
searchArticles(options): Promise<SearchResult>

// Simple search
simpleSearchArticles(query, limit)
```

### Tipos

```typescript
interface Article {
  id: string
  title: string
  titleEn: string | null
  slug: string
  summary: string
  summaryEn: string | null
  content: string
  contentEn: string | null
  tags: string[]
  imageUrl: string
  imageCaption: string | null
  sourceUrl: string | null
  isOriginal: boolean
  sentiment: string
  categoryId: string
  category: Category
  author: string
  published: boolean
  createdAt: Date
  updatedAt: Date
}

interface Category {
  id: string
  name: string
  slug: string
}
```

### Dependencias
- **@prisma/client**: ORM de base de datos
- **prisma**: Schema del proyecto

### Referencias
- [[Prisma Schema]]
- Consumido por: Frontend (pages/admin, pages/api)

---

## Images Module

**Ubicación**: `modules/images/`

### Funcionalidad
- Pipeline de imágenes para artículos
- Generación, QA, y almacenamiento

### Pipeline de Imagen

```
1. Imagen RSS Source
   │
   ├─▶ QA con Gemini Vision
   │      └─▶ Aprobada → Subir a Supabase → USAR
   │
   └─▶ Rechazada → Paso 2

2. AI Horde (intento 1)
   │
   ├─▶ Generar imagen
   │      └─▶ Subir a Supabase → USAR
   │
   └─▶ Fallo → Paso 3

3. AI Horde (intento 2)
   │
   └─▶ Fallo → Paso 4

4. Unsplash Stock (FALLBACK)
```

### API

```typescript
// Pipeline completo
generateArticleImageAndAnalyzeQA(
  imageData: ArticleImageData,
  sourceImageUrl?: string
): Promise<ImagePipelineResult>
```

### Tipos

```typescript
interface ImagePipelineResult {
  imageUrl: string
  caption: string
  qaResult: ImageAnalysisResult | null
  source: 'rss_source' | 'ai_horde' | 'unsplash_stock'
  attempts: string[]
  errors: string[]
}
```

### QA Features
- Coherencia con el artículo
- Calidad aceptable
- Sin marcas de agua

### Dependencias
- **@supabase/supabase-js**: Storage
- **dotenv**: Configuración

### Referencias
- [[Módulos#AI Module|AI Module]] (consume servicios de Vision y Horde)

---

## Newsletter Module

**Ubicación**: `modules/newsletter/`

### Funcionalidad
- Generación de newsletter semanal
- Envío a suscriptores
- Gestión de suscriptores

### API

```typescript
// Service
generateWeeklyNewsletter(...): Promise<Newsletter>

// Routes
POST /api/subscribe → Suscribirse
```

### Dependencias
- **PostgreSQL**: Almacenar suscriptores

### Referencias
- [[Cron Jobs]]

---

## Market Module

**Ubicación**: `modules/market/`

### Funcionalidad
- Integración con Binance Square
- APIs de mercado

---

## Scripts

### publish.ts (Main Pipeline)

```bash
# Ejecución
npx ts-node scripts/publish.ts
```

### Otros Scripts

| Script | Función |
|---------|--------|
| `force-generate.ts` | Forzar generación |
| `publish_test.ts` | Modo prueba |
| `generateArticleContent()` | Desde código |
| `send_newsletter.ts` | Enviar newsletter |

### Referencias
- [[Flujo de Publicación Completo]]
- [[Cron Jobs]]