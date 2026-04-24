# Módulos de EmeDotEme

## Índice de módulos

- Publisher Module (Orquestación)
- News Module (Clustering)
- AI Module (Generación)
- Images Module (Pipeline Visual)
- Storage & Notifications (Infraestructura)
- VRAM Manager (Recursos)

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
- **Análisis Vision**: Validación de imágenes mediante Gemini u Ollama Vision.

### Archivos clave
- `ai.service.ts`: Generación de texto y post-procesado.
- `ollama-vision.service.ts`: QA local de imágenes.

---

## Images Module (Pipeline Visual)

**Ubicación**: `modules/images/`

### Funcionalidad
- Pipeline jerárquico de imágenes: RSS -> Flux Local -> AI Horde -> Unsplash.
- Integración con el `VRAMManager` para carga segura de modelos.

### Archivos clave
- `image.service.ts`: Lógica del pipeline de imagen.
- `flux-image.service.ts`: Integración con Flux.1 local.

---

## Infrastructure Modules

### Storage Module
**Ubicación**: `modules/storage/`
- `supabase.service.ts`: Gestión de subida de imágenes a almacenamiento permanente.

### Notification Module
**Ubicación**: `modules/notifications/`
- `telegram.service.ts`: Notificaciones de éxito y alertas críticas de errores.

### VRAM Manager
**Ubicación**: `modules/vram/`
- `vram-manager.ts`: Control de memoria GPU. Obligatorio para alternar entre Ollama y Flux en hardware limitado.

---

## Scripts Principales

### publish.ts
```typescript
const publisher = new PublisherService(prisma);
await publisher.publishDailyArticle();
```

### Otros scripts
- `publish_test.ts`: Generación completa sin persistencia en DB (Modo Prueba).
- `regenerate-images.ts`: Re-procesar imágenes para artículos antiguos.

---

## Referencias

- [[04 - Flujos de Trabajo]]
- [[05 - Configuración]]
