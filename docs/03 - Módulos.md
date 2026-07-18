# Módulos de EmeDotEme

## Índice de módulos

- Publisher Module (Orquestación)
- News Module (Clustering)
- AI Module (Generación)
- Images Module (Pipeline Visual)
- Articles Module (Consultas y búsqueda)
- Market Module (Datos de mercado)
- Newsletter Module (Boletín semanal)
- Storage & Notifications (Infraestructura)

---

## Publisher Module (Orquestación)

**Ubicación**: `modules/publisher/`

Es el orquestador central del sistema. Encapsula el flujo de negocio de publicación diaria que antes residía en un script monolítico.

### Archivos clave
- `publisher.service.ts`: Clase `PublisherService` que coordina el proceso desde la obtención de noticias hasta el guardado final.

---

## News Module (Clustering)

**Ubicación**: `modules/news/`

### Funcionalidad
- Obtención de noticias desde fuentes RSS fiables.
- **ClusteringEngine**: Lógica pura para deduplicación por similitud y agrupamiento de noticias en temas comunes.

### Archivos clave
- `news-sources.service.ts`: Fetch de RSS.
- `clustering.ts`: Algoritmos de similitud (Jaccard) y agrupación.

---

## AI Module (Generación)

**Ubicación**: `modules/ai/`

### Funcionalidad
- Generación bilingüe (ES/EN) de artículos.
- **Prompts Centralizados**: Configuración en `config/prompts.ts`.
- **Análisis Vision**: Validación de imágenes mediante Gemini Vision.
- **Salida estructurada y validada**: los prompts a Gemini fuerzan un `responseSchema` (forma exacta del JSON) y toda respuesta se revalida con `zod` antes de usarse. Ver [[10 - Seguridad y Prompts de IA]].

### Archivos clave
- `ai.service.ts`: Generación de texto bilingüe y post-procesado.
- `gemini-text.service.ts`: Integración con Gemini API (rotación de claves, reintentos, `systemInstruction` + `responseSchema`).
- `gemini-vision.service.ts`: QA de imágenes mediante Gemini Vision.
- `hf-image.service.ts`: Cliente para Hugging Face Inference API.
- `constants.ts`: System prompts para generación de texto.
- `gemini-keys.ts`: Gestión de rotación de claves API de Gemini.
- `schemas.ts`: Fuente única de verdad de la forma del JSON esperado de la IA — esquemas Gemini (`responseSchema`) y esquemas `zod` (validación post-parseo) para artículo ES/EN, newsletter y análisis de imagen.

---

## Images Module (Pipeline Visual)

**Ubicación**: `modules/images/`

### Funcionalidad
- Pipeline jerárquico de imágenes: RSS -> Hugging Face -> Unsplash.

### Archivos clave
- `image.service.ts`: Lógica del pipeline de imagen (RSS → Hugging Face → Unsplash).

---

## Infrastructure Modules

### Storage Module
**Ubicación**: `modules/storage/`
- `supabase.service.ts`: Gestión de subida de imágenes a almacenamiento permanente.

### Notification Module
**Ubicación**: `modules/notifications/`
- `telegram.service.ts`: Notificaciones de éxito y alertas críticas de errores.

---

## Articles Module (Consultas y búsqueda)

**Ubicación**: `modules/articles/`

### Funcionalidad
- Consultas optimizadas de artículos para el frontend.
- Búsqueda full-text con filtros.
- Servicio de categorías.

### Archivos clave
- `article.service.ts`: Consultas, búsqueda, filtrado y paginación de artículos.
- `category.service.ts`: Gestión de categorías.
- `types.ts`: Tipos compartidos del módulo.

---

## Market Module (Datos de mercado)

**Ubicación**: `modules/market/`

### Funcionalidad
- Obtención de datos de criptomonedas en tiempo real.
- Integración con APIs de mercado para el ticker y gráficos.

### Archivos clave
- `market.service.ts`: Cliente de datos de mercado.

---

## Newsletter Module (Boletín semanal)

**Ubicación**: `modules/newsletter/`

### Funcionalidad
- Obtención de noticias relevantes de la semana para el newsletter.
- Generación de contenido del boletín.

### Archivos clave
- `news.service.ts`: Fetch de noticias para newsletter.

---

## Scripts Principales

### publish.ts
```typescript
const publisher = new PublisherService(prisma);
await publisher.publishDailyArticle();
```

### Otros scripts
- `publish_test.ts`: Generación completa sin persistencia en DB (Modo Prueba).
- `publish-ia.ts`: Pipeline especializado en temas de Inteligencia Artificial.
- `force-generate.ts`: Fuerza generación omitiendo verificación de duplicados.
- `send_newsletter.ts`: Generación y envío del newsletter semanal.

---

## Referencias

- [[04 - Flujos de Trabajo]]
- [[05 - Configuración]]
