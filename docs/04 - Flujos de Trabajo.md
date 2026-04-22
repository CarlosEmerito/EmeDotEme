# Flujos de Trabajo EmeDotEme

## Índice

- [[Pipeline de Publicación]]
- [[Flujo de Imágenes]]
- [[Flujo de AI]]
- [[Cron Jobs]]

---

## Pipeline de Publicación

### Descripción General

El pipeline de publicación es el flujo principal que genera y publica automáticamente un artículo cada día.

### Diagrama

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PIPELINE DE PUBLICACIÓN                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. INICIALIZACIÓN                                                  │
│    - Cargar categorías desde BD                                      │
│    - Fetch títulos recientes                                         │
│    - Fetch URLs recientes                                          │
└─────────────────────────────────────────────────────────────────────┬─────────────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. FETCH NOTICIAS (NewsSources Service)                              │
│    ┌──────────────────────────────────────────────────────────────┐       │
│    │ • Fetch RSS de fuentes fiables                          │       │
│    │ • Parsear y filtrar noticias (últimas 48h)            │       │
│    │ • Deduplicar por similitud de títulos                 │       │
│    │ • Filtrar artículos ya cubiertos                    │       │
│    │ • Clustering por tema                              │       │
│    └──────────────────────────────────────────────────────┘       │
│                                                                      │
│    Resultado: newsItems[]                                            │
└─────────────────────────────────────────────────────────────────────┬─────────────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. GENERACIÓN IA (AI Service)                                      │
│    ┌──────────────────────────────────────────────────────────────┐   │
│    │ SYSTEM PROMPT: "Eres periodista profissional..."             │   │
│    │                                                              │   │
│    │ USER PROMPT: Noticias + instrucciones                         │   │
│    └──────────────────────────────────────────────────────────────┘   │
│                           │                                         │
│              ┌────────────┴────────────┐                            │
│              ▼                         ▼                            │
│         GEMINI API                 OLLAMA LOCAL                    │
│              │                         │                            │
│              ├─▶ JSON válido         ├─▶ JSON válido               │
│              │                         │                            │
│              └─▶ FALLO               └─▶ FALLO                   │
│                                       │                            │
│                                       ▼                            │
│                              ARTÍCULO DE EJEMPLO                    │
│                              (ERROR - notifica Telegram)            │
│                                                                      │
│    Resultado: {title, summary, content, tags, imagePrompt, ...}         │
└─────────────────────────────────────────────────────────────────────┬─────────────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. TRADUCCIÓN Y POST-PROCESADO                                        │
│    ┌──────────────────────────────────────────────────────────────┐   │
│    │ translateArticleContent()                                    │   │
│    │   • Añade campos *_en (titleEn, summaryEn, contentEn)        │   │
│    └──────────────────────────────────────────────────────────────┘   │
│                           │                                         │
│                           ▼                                         │
│    ┌──────────────────────────────────────────────────────────────┐   │
│    │ postprocessWithOllama()                                 │   │
│    │   • Corrige mayúsculas                                  │   │
│    │   • Nombres propios, siglas                            │   │
│    └──────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────��────────────┬─────────────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. PROCESO DE IMAGEN (Image Service)        │
│    ┌────────────────────────────────────┐
│    │ generateArticleImageAndAnalyzeQA()   │
│    └────────────────────────────────────┘
│                           │
│              ┌────────────┴────────────┐
│              ▼                         ▼
│       RSS SOURCE              AI HORDE + QA
│              │                         │
│              └─▶ FALLBACK: UNSPLASH │
│                                              │
│    Resultado: {imageUrl, caption}                 │
└─────────────────────────────────────────────┬──────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. GUARDAR EN BASE DE DATOS                                 │
│    ┌──────────────────────────────────────────────────────┐       │
│    │ prisma.article.create({                                │       │
│    │   title, titleEn, slug, summary, summaryEn,           │       │
│    │   content, contentEn, tags, imageUrl, imageCaption,    │       │
│    │   sourceUrl, categoryId, sentiment, published: true    │       │
│    │ })                                                  │       │
│    └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┬───────────────┘
                                                    │
                                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. PUBLICAR EN REDES SOCIALES (opcional)                        │
│    • Guardar latest_article.json para Binance Square                │
│    • Notificar errores por Telegram                              │
└─────────────────────────────────────────────────────────────────┘
```

### Código de Ejecución

```bash
# Manual
npx ts-node scripts/publish.ts

# O automáticamente via Cron Job (configurado en cron-job.org)
```

### Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL=

# Gemini
GEMINI_API_KEY=

# Ollama (local)
OLLAMA_MODEL=qwen3.5:9b

# Telegram (para notificaciones)
TELEGRAM_TOKEN=
TELEGRAM_CHAT_ID=

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### Referencias
- [[Scripts#publish.ts|publish.ts]]
- [[Variables de Entorno]]
- [[Cron Jobs]]

---

## Flujo de Imágenes

### Pipeline de Imagen Detallado

```
┌─────────────────────────────────────────────────────────────────┐
│               PIPELINE DE IMAGEN                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PAS0: Recibir datos del artículo                                 │
│    {title, slug, topic, originalPrompt, summary}                │
└─────────────────────────────────────┬───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ PAS1: Imagen de Fuente RSS                                      │
│    ┌───────────────────────────────────────────────────────┐     │
│    │ 1. ¿sourceImageUrl existe? NO → Paso 2               │     │
│    │                                                      │     │
│    │ 2. QA con Gemini Vision                                │     │
│    │    • Es coherente con el artículo?                   │     │
│    │    • Calidad aceptable?                          │     │
│    │    • Tiene marca de agua?                  │     │
│    │                                                      │     │
│    │ 3. Si APROBADA:                                 │     │
│    │    • Subir a Supabase Storage                  │     │
│    │    • Usar como imagen final                  │     │
│    │                                                      │     │
│    │ 4. Si RECHAZADA:                               │     │
│    │    • Error: "no pasó QA"           → Paso 2    │     │
│    └───────────────────────────────────────────────────────┘     │
└─────────────────────────────────────┬───────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ PAS2: AI Horde (intento 1)                                  │
│    ┌───────────────────────────────────────────────────────┐     │
│    │ 1. Generar imagen con AI Horde                    │     │
│    │    • Prompt mejorado: title + ", masterpiece..."    │     │
│    │    • 1024x1024, 100 steps                 │     │
│    │                                                      │     │
│    │ 2. Verificar que no sea CSAM/error              │     │
│    │                                                      │     │
│    │ 3. Si OK:                                       │     │
│    │    • Subir a Supabase Storage                  │     │
│    │    • Usar (sin QA para ahorrar tiempo)         │     │
│    │                                                      │     │
│    │ 4. Si ERROR:                                  │     │
│    │    • Error: "falló generación" → Paso 3       │     │
│    └───────────────────────────────────────────────────────┘     │
└─────────────────────────────────────┬───────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ PAS3: AI Horde (intento 2) - Retry                             │
│    Mismo proceso que Paso 2                                     │
└─────────────────────────────────────┬───────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ PAS4: FALLBACK - Unsplash Stock                                 │
│    ┌───────────────────────────────────────────────���─���─────┐     │
│    │ 1. Seleccionar imagen por categoría                   │     │
│    │ 2. Usar Caption genérico                             │     │
│    │ 3. Final                                            │     │
│    └───────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### Código

```typescript
const result = await generateArticleImageAndAnalyzeQA(
  { title, slug, topic, originalPrompt, summary },
  rssImageUrl // de la noticia
)
```

### Referencias
- [[Módulos#Images Module]]

---

## Flujo de AI

### Generación de Texto

```
┌─────────────────────────────────────────────────────────────────┐
│           FLUJO DE GENERACIÓN DE ARTÍCULO                         │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ INPUT: Contexto                                                │
│    • recentTitles: string[]                                     │
│    • newsItems: NewsItem[]                                      │
└─────────────────────────────────────┬───────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ SYSTEM PROMPT                                                  │
│    "Eres un periodista profesional de noticias                     │
│     sobre criptomonedas, blockchain y tecnología                 │
│     para el medio digital EmeDotEme..."                         │
└─────────────────────────────────────┬───────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ USER PROMPT                                                   │
│    • Noticias formateadas                                      │
│    • Instrucciones del artículo                               │
│    • Cláusula de evitación                                    │
└─────────────────────────────────────┬───────────────────────────┘
                                    │
                ┌───────────────────┴───────────────────┐
                ▼                                   ▼
            GEMINI API                            OLLAMA
                │                                   │
                ├─ OK → Parse JSON                  ├─ OK → Parse JSON
                │                                   │
                └─ FAIL → Try Ollama               └─ FAIL → Ejemplo estático
                    │                                   │
                    └─ FAIL → Ejemplo estático          │
```

### Post-procesado

```
┌─────────────────────────────────────────────────────────────────┐
│           POST-PROCESADO ORTOGRÁFICO                              │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ INPUT: Artículo generado                                          │
│    {title, summary, content}                                   │
└─────────────────────────────────────┬───────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ OLLAMA LOCAL: postprocessWithOllama                          │
│    System: "Eres un corrector ortográfico experto..."         │
│    User: JSON.stringify(article)                             │
└─────────────────────────────────────┬───────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ OUTPUT: Artículo corregido                                      │
│    {title: "...", summary: "...", content: "..."}              │
└─────────────────────────────────────────────────────────────────┘
```

### Referencias
- [[Módulos#AI Module]]

---

## Cron Jobs

### Programación

| Job | Frecuencia | Script |
|-----|-----------|--------|
| Publicación diaria | 1x día (8:00 UTC) | `scripts/publish.ts` |
| Newsletter semanal | 1x semana | `scripts/send_newsletter.ts` |

### Configuración

Los cron jobs se configuran en **cron-job.org** (cuenta gratuita).

### Referencias
- [[Variables de Entorno]]