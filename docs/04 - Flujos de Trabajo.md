# Flujos de Trabajo de EmeDotEme

## Índice

- Pipeline de publicación (Publisher Service)
- Flujo de imágenes
- Flujo de IA
- Gestión de Memoria (VRAM)
- Cron jobs

---

## Pipeline de publicación

### Descripción general

El pipeline de publicación es el flujo principal que genera y publica automáticamente un artículo cada día. Ha sido refactorizado en un **Publisher Service** para mejorar la modularidad y resiliencia.

### Diagrama del Pipeline

```mermaid
graph TD
    classDef init fill:#f1f5f9,stroke:#64748b,stroke-width:2px;
    classDef step fill:#e0f2fe,stroke:#0ea5e9,stroke-width:2px;
    classDef alert fill:#fef3c7,stroke:#f59e0b,stroke-width:2px;

    Start((Inicio)):::init --> Step1
    
    Step1["<b>1. INICIALIZACIÓN</b><br/><i>(ensureCategories)</i><br/>- Asegurar categorías base<br/>- Obtener contexto reciente"]:::step --> Step2
    
    Step2["<b>2. FETCH NOTICIAS</b><br/><i>(NewsSources Service)</i><br/>- Fetch RSS<br/>- Agrupamiento en temas"]:::step --> Step3
    
    Step3["<b>3. GENERACIÓN IA</b><br/><i>(AI Service)</i><br/>- Generación bilingüe (ES->EN)<br/>- Post-procesado ortográfico"]:::step --> Step4
    
    Step4["<b>4. PROCESO DE IMAGEN</b><br/><i>(Image Service)</i><br/>- RSS → QA Gemini Vision<br/>- HF API (FLUX.1-schnell, SD3.5, Dreamshaper)<br/>- Fallo → artículo NO publicado"]:::step --> Step5
    
    Step5["<b>5. PERSISTENCIA</b><br/><i>(Base de Datos)</i><br/>- Guardar artículo y etiquetas"]:::step --> Step6
    
    Step6["<b>6. NOTIFICACIONES</b><br/><i>(Metadatos)</i><br/>- JSON para Binance Square<br/>- Notificación vía Telegram"]:::step
    
    Step6 --> End((Fin)):::init
```

### Código de ejecución

```bash
# El script principal ahora es un simple wrapper del PublisherService
npx tsx scripts/publish.ts
```

### Variables de entorno CRÍTICAS

> [!NOTE]
> La generación de imágenes y texto funciona exclusivamente a través de APIs en la nube (Gemini, Hugging Face). Ollama y Flux local están completamente desactivados.

```env
# No requeridas en cloud — desactivadas por defecto
# OLLAMA_MODEL="gemma4:26b"
# OLLAMA_VISION_MODEL="gemma4:e4b"
```

---

## Flujo de imágenes

### Pipeline de imagen detallado

```mermaid
graph TD
    A[Inicio: Datos del Artículo] --> B{¿Hay Imagen RSS?}
    B -- Sí --> E[QA Gemini Vision]
    B -- No --> D[Hugging Face API]
    E -- Aprobada --> F[Subir a Supabase]
    E -- Rechazada / Error 403 --> D
    D --> M1["Modelo 1: FLUX.1-schnell"]
    M1 -- Éxito --> QA2[QA Gemini Vision]
    M1 -- Fallo 410/402 --> M2["Modelo 2: SD 3.5 Medium"]
    M2 -- Éxito --> QA2
    M2 -- Fallo --> M3["Modelo 3: Dreamshaper-8"]
    M3 -- Éxito --> QA2
    M3 -- Fallo --> ERR["❌ Error crítico → artículo NO publicado"]
    QA2 -- Aprobada --> F
    QA2 -- Rechazada --> ERR
    F --> L[URL Permanente en Supabase]
```

### Gestión de Supabase (StorageService)
Toda imagen aceptada o generada se sube automáticamente a Supabase Storage para evitar enlaces rotos de fuentes externas.

---

## Flujo de IA

El flujo de IA ahora utiliza **AI_PROMPTS** centralizados en `config/prompts.ts`.

### Generación de imagen (`imagePrompt`)

Gemini genera una descripción visual concreta en inglés que se usa para generar la imagen con FLUX.1-schnell. Las reglas son:
- ✅ Escenas **fotorrealistas** estilo Reuters/Bloomberg: salas de trading, reuniones, edificios, pantallas
- ❌ Prohibido: cyberpunk, neon, digital art, glowing nodes, 3D renders, sci-fi

El servicio HF antepone automáticamente un prefijo de calidad al prompt antes de enviárselo al modelo:
```
photorealistic, high resolution, professional press photograph, editorial photography,
sharp focus, natural lighting, 4k quality, realistic textures, no watermarks, no text overlays,
[descripción del artículo],
hyperdetailed, award-winning photograph, documentary style
```

### Publicación en redes sociales y hashtags dinámicos

Los scripts de Python (`publish_telegram.py`, `publish_direct.py`, `publish_bluesky.py`) leen el archivo `tmp/latest_article.json` generado por el pipeline. Las etiquetas (`tags`) del artículo se convierten automáticamente en hashtags mediante `format_hashtags()` en `social_publish_utils.py`:
- `#EmeDotEme` siempre es el **primer hashtag**
- Los tags del artículo se convierten a PascalCase sin caracteres especiales (ej. `"Banca Sella"` → `#BancaSella`)
- El mensaje de Telegram **no incluye precios de criptomonedas** ni índice Fear & Greed

### Postprocesado

El postprocesado ortográfico en local mediante Ollama ha sido **desactivado** para habilitar la ejecución serverless en la nube, optimizando el tiempo y dependiendo exclusivamente del modelo `gemini-2.5-flash` para la generación y coherencia.

---

## Gestión de Memoria (VRAM) - (Desactivado en Cloud)

Al correr de manera serverless en GitHub Actions y consumir APIs en la nube (Gemini, Hugging Face), no hay un consumo de recursos de tarjeta gráfica (GPU/VRAM) local ni contenedores Docker locales que gestionar. La clase `VRAMManager` y sus métodos siguen existiendo por compatibilidad pero no realizan operaciones de espera o descarga.

---

## Automatización y Flujo Temporal

La ejecución automática se orquesta nativamente mediante **GitHub Actions** en contenedores efímeros bajo demanda:

| Proceso | Frecuencia | Orquestador | Comando Ejecutado |
|---------|------------|-------------|-------------------|
| **Publicación automática** | Cada 4 horas (`0 */4 * * *`) | GitHub Actions | `./publicar.sh` |
| **Envío de Newsletter** | Semanal | GitHub Actions (opcional) | `./enviar_newsletter.sh` |
| **Ejecución de Prueba** | Manual | GitHub Actions (`workflow_dispatch`) | `./publicarprueba.sh` |
