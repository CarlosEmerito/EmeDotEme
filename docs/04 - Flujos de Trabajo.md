# Flujos de Trabajo EmeDotEme

## Índice

- Pipeline de Publicación
- Flujo de Imágenes
- Flujo de AI
- Cron Jobs

---

## Pipeline de Publicación

### Descripción General

El pipeline de publicación es el flujo principal que genera y publica automáticamente un artículo cada día.

### Diagrama

```
+-------------------------------------------------------------+
|                 PIPELINE DE PUBLICACIÓN                       |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| 1. INICIALIZACIÓN                                           |
|    - Cargar categorías desde BD                            |
|    - Fetch títulos recientes                               |
|    - Fetch URLs recientes                                   |
+-------------------------------+-----------------------------+
                              |
                              v
+-------------------------------------------------------------+
| 2. FETCH NOTICIAS (NewsSources Service)                    |
|    +---------------------------------------------------+     |
|    | - Fetch RSS de fuentes fiables                    |     |
|    | - Parsear y filtrar noticias (últimas 48h)     |     |
|    | - Deduplicar por similitud de títulos           |     |
|    | - Filtrar artículos ya cubiertos                |     |
|    | - Clustering por tema                          |     |
|    +---------------------------------------------------+     |
|    Resultado: newsItems[]                                 |
+-------------------------------+-----------------------------+
                              |
                              v
+-------------------------------------------------------------+
| 3. GENERACIÓN IA (AI Service)                              |
|    +---------------------------------------------------+   |
|    | SYSTEM PROMPT: "Eres periodista profesional..." |   |
|    | USER PROMPT: Noticias + instrucciones              |   |
|    +---------------------------------------------------+   |
|                           |                               |
|              +------------+-----------+                 |
|              v                        v                  |
|         GEMINI API            OLLAMA LOCAL             |
|              |                        |                  |
|              +-> OK -> JSON válido  +-> JSON válido    |
|              |                        |                  |
|              +-- FAIL --+          +-- FAIL --+       |
|              v                        v                  |
|         Try Ollama         Artículo de ejemplo         |
|              |                        |                  |
|              +-- FAIL --+          +-- (ERROR)        |
|                         v                        v      |
|                     Artículo de ejemplo              |
|                     (notifica Telegram)              |
|                                                          |
|    Resultado: {title, summary, content, tags, ...}     |
+-------------------------------+-----------------------------+
                              |
                              v
+-------------------------------------------------------------+
| 4. TRADUCCIÓN Y POST-PROCESADO                             |
|    +---------------------------------------------------+   |
|    | translateArticleContent()                         |   |
|    |   - Añade campos *_en (titleEn, summaryEn, ...)  |   |
|    +---------------------------------------------------+   |
|                           |                               |
|                           v                               |
|    +---------------------------------------------------+   |
|    | postprocessWithOllama()                    |   |
|    |   - Corrige mayúsculas                       |   |
|    |   - Nombres propios, siglas                 |   |
|    +---------------------------------------------------+   |
+-------------------------------+-----------------------------+
                              |
                              v
+-------------------------------------------------------------+
| 5. PROCESO DE IMAGEN (Image Service)                       |
|    +----------------------------------------+            |
|    | generateArticleImageAndAnalyzeQA()      |            |
|    +----------------------------------------+            |
|                           |                            |
|              +------------+-----------+              |
|              v                        v               |
|       RSS SOURCE              AI HORDE + QA          |
|              |                        |               |
|              +-- FALLBACK: UNSPLASH -+               |
|                                            |
|    Resultado: {imageUrl, caption}          |
+-------------------------------+------------+
                              |
                              v
+-------------------------------------------------------------+
| 6. GUARDAR EN BASE DE DATOS                             |
|    +-------------------------------------------+        |
|    | prisma.article.create({                  |        |
|    |   title, titleEn, slug, summary, ...     |        |
|    |   published: true                         |        |
|    | })                                       |        |
|    +-------------------------------------------+        |
+-------------------------------+------------+------------+
                              |
                              v
+-------------------------------------------------------------+
| 7. PUBLICAR EN REDES SOCIALES (opcional)                |
|    - Guardar latest_article.json para Binance Square     |
|    - Notificar errores por Telegram                      |
+-------------------------------------------------------------+
```

### Código de Ejecución

```bash
# Manual
npx tsx scripts/publish.ts

# O automáticamente via Cron Job (configurado en cron-job.org)
```

### Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL=

# Gemini
GEMINI_API_KEY=

# Ollama (local)
OLLAMA_MODEL=gemma4:26b

# Telegram (para notificaciones)
TELEGRAM_TOKEN=
TELEGRAM_CHAT_ID=

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### Referencias

- [[06 - Scripts]]
- [[05 - Configuración]]

---

## Flujo de Imágenes

### Pipeline de Imagen Detallado

```
+-------------------------------------------------------------+
|              PIPELINE DE IMAGEN                             |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| PASO 0: Recibir datos del artículo                          |
|    {title, slug, topic, originalPrompt, summary}           |
+-------------------------------+-----------------------------+
                              |
                              v
+-------------------------------------------------------------+
| PASO 1: Imagen de Fuente RSS                              |
|    +---------------------------------------------+         |
|    | 1. ¿sourceImageUrl existe? NO -> Paso 2    |         |
|    |                                            |         |
|    | 2. QA con Gemini Vision                   |         |
|    |    - Es coherente con el artículo?        |         |
|    |    - Calidad aceptable?                  |         |
|    |    - Tiene marca de agua?                |         |
|    |                                            |         |
|    | 3. Si APROBADA:                        |         |
|    |    - Subir a Supabase Storage          |         |
|    |    - Usar como imagen final            |         |
|    |                                            |         |
|    | 4. Si RECHAZADA:                      |         |
|    |    - Error "no pasó QA" -> Paso 2     |         |
|    +---------------------------------------------+         |
+-------------------------------+-----------------------------+
                              |
                              v
+-------------------------------------------------------------+
| PASO 2: AI Horde (intento 1)                             |
|    +---------------------------------------------+         |
|    | 1. Generar imagen con AI Horde          |         |
|    |    - Prompt mejorado: title + "..."     |         |
|    |    - 1024x1024, 100 steps             |         |
|    |                                            |         |
|    | 2. Verificar que no sea CSAM/error     |         |
|    |                                            |         |
|    | 3. Si OK:                           |         |
|    |    - Subir a Supabase Storage          |         |
|    |    - Usar (sin QA para ahorrar)      |         |
|    |                                            |         |
|    | 4. Si ERROR:                        |         |
|    |    - "falló generación" -> Paso 3    |         |
|    +---------------------------------------------+         |
+-------------------------------+-----------------------------+
                              |
                              v
+-------------------------------------------------------------+
| PASO 3: AI Horde (intento 2)                             |
|    Mismo proceso que Paso 2                                    |
+-------------------------------+-----------------------------+
                              |
                              v
+-------------------------------------------------------------+
| PASO 4: FALLBACK - Unsplash Stock                          |
|    +---------------------------------------------+         |
|    | 1. Seleccionar imagen por categoría   |         |
|    | 2. Usar Caption genérico           |         |
|    | 3. Final                           |         |
|    +---------------------------------------------+         |
+-------------------------------------------------------------+
```

### Código

```typescript
const result = await generateArticleImageAndAnalyzeQA(
  { title, slug, topic, originalPrompt, summary },
  rssImageUrl // de la noticia
)
```

### Referencias

- [[03 - Módulos]]

---

## Flujo de AI

### Generación de Texto

```
+-------------------------------------------------------------+
|        FLUJO DE GENERACIÓN DE ARTÍCULO                      |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| INPUT: Contexto                                           |
|    - recentTitles: string[]                               |
|    - newsItems: NewsItem[]                                 |
+-------------------------------+---------------------------+
                              |
                              v
+-------------------------------------------------------------+
| SYSTEM PROMPT                                             |
|    "Eres un periodista profesional de noticias           |
|     sobre criptomonedas, blockchain y tecnología           |
|     para el medio digital EmeDotEme..."                  |
+-------------------------------+---------------------------+
                              |
                              v
+-------------------------------------------------------------+
| USER PROMPT                                              |
|    - Noticias formateadas                                 |
|    - Instrucciones del artículo                          |
|    - Cláusula de evitación                              |
+-------------------------------+---------------------------+
                              |
              +-------------------+-------------------+
              v                                   v
          GEMINI API                            OLLAMA
              |                                   |
              +-> OK -> Parse JSON              +-> OK -> Parse JSON
              |                                   |
              +-- FAIL --+                      +-- FAIL --+
              v                                   v
          Try Ollama                       Ejemplo estático
              |
              +-- FAIL --+
              v
        Ejemplo estático
```

### Post-procesado

```
+-------------------------------------------------------------+
|        POST-PROCESADO ORTOGRÁFICO                            |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| INPUT: Artículo generado                                   |
|    {title, summary, content}                            |
+-------------------------------+---------------------------+
                              |
                              v
+-------------------------------------------------------------+
| OLLAMA LOCAL: postprocessWithOllama                     |
|    System: "Eres un corrector ortográfico experto..."    |
|    User: JSON.stringify(article)                        |
+-------------------------------+---------------------------+
                              |
                              v
+-------------------------------------------------------------+
| OUTPUT: Artículo corregido                                |
|    {title: "...", summary: "...", content: "..."}        |
+-------------------------------------------------------------+
```

### Referencias

- [[03 - Módulos]]

---

## Cron Jobs

### Programación

| Job | Frecuencia | Script |
|-----|-----------|---------|
| Publicación diaria | 1x día (8:00 UTC) | `scripts/publish.ts` |
| Newsletter semanal | 1x semana | `scripts/send_newsletter.ts` |

### Configuración

Los cron jobs se configuran en **cron-job.org** (cuenta gratuita).

### Referencias

- [[05 - Configuración]]