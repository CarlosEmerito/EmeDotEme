# Módulos de EmeDotEme

## Índice de módulos

- News Sources Module
- AI Module
- Articles Module
- Images Module
- Newsletter Module
- Market Module

---

## News Sources Module

**Ubicación**: `modules/news/`

### Funcionalidad
- Obtención de noticias desde fuentes RSS fiables.
- Deduplicación y agrupamiento de noticias.
- Filtrado de artículos recientes.

### Archivos clave

| Archivo                   | Descripción                        |
|---------------------------|------------------------------------|
| `news-sources.service.ts` | Servicio principal de fetch RSS    |

### Fuentes configuradas

```
The Hacker News           → Ciberseguridad (alta fiabilidad)
Krebs on Security         → Ciberseguridad (alta fiabilidad)
Security Affairs          → Ciberseguridad (media fiabilidad)
CoinDesk                  → Criptomonedas (alta fiabilidad)
MIT Technology Review AI  → IA (alta fiabilidad)
Decrypt                   → Criptomonedas (alta fiabilidad)
VentureBeat AI            → IA (alta fiabilidad)
El País Tecnología        → Tecnología (media fiabilidad)
```

### API

```typescript
// Obtener noticias principalesetchLatestNews(recentTitles, recentSourceUrls): Promise<FetchedNewsContext>

// Tipos
interface FetchedNewsContext {
  newsItems: NewsItem[]
  topicClusters: NewsItem[][]
  totalFetched: number
  sourcesResponded: string[]
}
```

### Dependencias
- **rss-parser**: Para parsear feeds RSS.
- **dotenv**: Configuración.

---

## AI Module

**Ubicación**: `modules/ai/`

### Funcionalidad
- Generación de artículos con IA (Gemini/Ollama).
- Soporte para **modelos de razonamiento**: El streaming de Ollama captura tanto el campo `response` como el campo `thinking`.
- **Gestión de VRAM**: Proceso de descarga explícita de modelos para evitar colisiones entre el modelo de texto (Ollama) y el modelo de imagen (Flux).
- Post-procesado ortográfico y análisis de imágenes (Vision).

### Gestión de VRAM (Handoff)
Para GPUs de 8GB, el sistema orquesta la memoria de la siguiente forma:
1. Las llamadas a Ollama usan `keep_alive: 0` para no retener el modelo tras la respuesta.
2. Antes de iniciar Flux, se llama a `unloadOllamaModels()` que:
   - Envía una petición de descarga a Ollama.
   - Pausa **8 segundos** para que el driver NVIDIA limpie los buffers.
   - Pausa adicional de **5 segundos** para estabilidad térmica/GPU.

### Submódulos

| Submódulo    | Archivo                    | Función                  |
|--------------|----------------------------|--------------------------|
| AI Service   | `ai.service.ts`            | Orquestación principal   |
| Gemini Text  | `gemini-text.service.ts`   | Generación de texto (API)|
| Gemini Vision| `gemini-vision.service.ts` | QA de imágenes           |
| Ollama       | `ai.service.ts`            | Fallback local texto     |
| Ollama Vision| `ollama-vision.service.ts` | QA fallback              |
| Flux Local   | `flux-image.service.ts`    | Gen. imágenes (Local)    |
| AI Horde     | `aihorde-image.service.ts` | Gen. imágenes (Fallback) |

### Flujo de generación

```
1. generateArticleContent(recentTitles, newsItems)
   |
   +-> Intentar Gemini API
   |     +-> Si falla → Ollama local
   |             +-> Si falla → Artículo de ejemplo
   |
   2. translateArticleContent()
      +-> Añade campos *_en
   |
   3. postprocessWithOllama()
      +-> Corrige mayúsculas
```

### API principal

```typescript
// Generar artículo desde noticias
generateArticleContent(
  recentTitles: string[],
  newsContext: NewsItem[]
): Promise<GeneratedArticle>

// Generar artículo en inglés
generateEnglishContent(
  esArticle: GeneratedArticle,
  newsContext: NewsItem[]
): Promise<Partial<GeneratedArticle>>

// Interfaz de respuesta
interface GeneratedArticle {
  title: string
  titleEn?: string
  summary: string
  summaryEn?: string
  content: string
  contentEn?: string
  imagePrompt: string
  tags: string[]
  sourceUrl?: string
  sources?: string[]
  imageCaption?: string
  category?: string
}
```

### Estrategias de fallback

1. **Texto**: Gemini → Ollama local → Artículo estático de ejemplo.
2. **Imágenes**: RSS Source → Flux Local → AI Horde → Unsplash Stock.
3. **QA**: Gemini Vision → Ollama Vision.

### Dependencias
- **@google/generative-ai**: Gemini API.
- **node-fetch**: Llamadas HTTP.
- **dotenv**: Configuración.

---

## Articles Module

**Ubicación**: `modules/articles/`

### Funcionalidad
- Gestión de artículos en la base de datos.
- **Motor de Ranking**: Sistema de ordenamiento dinámico basado en relevancia, prioridad y estado "fijado".
- Búsqueda y filtrado eficiente por categorías y etiquetas (tags).

### Motor de Ranking (Ranking Engine)
El sistema ha evolucionado de un orden puramente cronológico a uno basado en **Relevancia**. Todas las consultas principales (`getPublishedArticles`, `getArticlesByCategorySlug`, etc.) utilizan la siguiente cascada de prioridades:

1.  **isPinned**: Los artículos marcados como "fijados" aparecen siempre primero.
2.  **priority**: En caso de empate, se ordena por el peso numérico de prioridad (mayor es mejor).
3.  **publishedAt**: Luego se considera la fecha de publicación efectiva (permite programar).
4.  **createdAt**: Finalmente, se usa la fecha de creación técnica.

### API

```typescript
// Obtener artículos publicados (usa el Ranking Engine)
getPublishedArticles(limit, skip): Promise<Article[]>

// Por slug
getArticleBySlug(slug): Promise<Article>

// Relacionados
getRelatedArticles(categoryId, articleId, limit)

// Por categoría (usa el Ranking Engine)
getArticlesByCategorySlug(slug, limit, skip)

// Búsqueda avanzada
searchArticles(options): Promise<SearchResult>

// Búsqueda simple
simpleSearchArticles(query, limit)
```

### Tipos

```typescript
interface Article {
  id: string          // uuid()
  title: string
  titleEn?: string
  slug: string
  summary?: string
  summaryEn?: string
  content: string
  contentEn?: string
  imageUrl?: string
  imageCaption?: string
  sourceUrl?: string
  author: string
  published: boolean
  isOriginal: boolean
  articleTags: Tag[]  // Relación normalizada
  isPinned: boolean   // Para fijar noticias arriba
  priority: number    // Peso para el ranking
  viewCount: number   // Contador de visitas
  publishedAt?: Date  // Fecha de publicación efectiva
  sentiment: string   // defaults to "Neutral ⚖️"
  categoryId: string
  category: Category
  createdAt: Date
  updatedAt: Date
}

interface Tag {
  id: string
  name: string
  slug: string
  articles: Article[]
  createdAt: Date
}

interface Category {
  id: string          // uuid()
  name: string
  slug: string
  articles: Article[]
  createdAt: Date
  updatedAt: Date
}
```

interface Subscriber {
  id: string          // uuid()
  email: string
  active: boolean     // defaults to true
  createdAt: Date
}

interface Setting {
  id: string
  key: string
  value: string
  updatedAt: Date
}
```

### Dependencias
- **@prisma/client**: ORM de base de datos.

---

## Images Module

**Ubicación**: `modules/images/`

### Funcionalidad
- Pipeline de imágenes jerárquico.
- **Flux.1 Local**: Integrado como generador principal. Soporta monitoreo de progreso paso a paso (`docker logs -f flux-api-server`).
- **Validación Estricta (QA)**:
  - Rechazo total de imágenes de **Decrypt**.
  - Detección de marcas de agua superpuestas (CoinDesk, Cointelegraph, etc.).
  - Evaluación de coherencia contextual (ej. un edificio de oficinas es válido para noticias financieras aunque no haya logos de cripto).

### Pipeline de imagen

```
1. Imagen RSS Source
   |
   +-> QA con Gemini Vision (Regla: No Decrypt)
   |     +-> Aprobada → Subir a Supabase → USAR
   |
   +-> Rechazada → Paso 2

2. Flux Local (PRIORIDAD ALTA)
   |
   +-> Gestión VRAM: Descargar Ollama (13s pausa total)
   +-> Generar imagen (Flux.1 [dev]) -> Progreso en logs
   +-> QA con Gemini Vision
   |     +-> Aprobada → Subir a Supabase → USAR
   |
   +-> Fallo o Servidor Offline → Paso 3

3. AI Horde (FALLBACK EXTERNO)
   |
   +-> Generar imagen
   |     +-> Subir a Supabase → USAR
   |
   +-> Fallo → Paso 4

4. Unsplash Stock (FALLBACK FINAL)
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
  source: 'rss_source' | 'flux_local' | 'ai_horde' | 'unsplash_stock'
  attempts: string[]
  errors: string[]
}
```

### QA Features
- Coherencia con el artículo.
- Calidad aceptable.
- Sin marcas de agua.

### Dependencias
- **@supabase/supabase-js**: Storage.
- **dotenv**: Configuración.

---

## Newsletter Module

**Ubicación**: `modules/newsletter/`

### Funcionalidad
- Generación de newsletter semanal.
- Envío a suscriptores.
- Gestión de suscriptores.

### API

```typescript
// Servicio
generateWeeklyNewsletter(...): Promise<Newsletter>

// Rutas
POST /api/subscribe → Suscribirse
```

### Dependencias
- **PostgreSQL**: Almacenamiento de suscriptores.
- **resend**: SDK para envío de emails.

---

## Market Module

**Ubicación**: `modules/market/`

### Funcionalidad
- Integración con Binance Square.
- APIs de mercado.

---

## Scripts

### publish.ts (Pipeline principal)

```bash
# Ejecución
npx tsx scripts/publish.ts
```

### Otros scripts

| Script                | Función            |
|-----------------------|--------------------|
| `force-generate.ts`   | Forzar generación  |
| `publish_test.ts`     | Modo prueba        |
| `send_newsletter.ts`  | Enviar newsletter  |

---

## Referencias

- [[04 - Flujos de Trabajo]]
- [[06 - Scripts]]
- [[05 - Configuración]]