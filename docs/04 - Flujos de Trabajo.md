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
    
    Step4["<b>4. PROCESO DE IMAGEN</b><br/><i>(Image Service)</i><br/>- RSS -> Flux -> Horde -> Unsplash<br/>- Gestión VRAM"]:::step --> Step5
    
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

> [!WARNING]
> A diferencia de versiones anteriores, **no existen modelos por defecto** para Ollama. Si no están en el `.env`, el sistema usará exclusivamente Gemini para la generación de texto.

```env
OLLAMA_MODEL="qwen3.5:9b"        # Para generación de texto local (opcional)
OLLAMA_VISION_MODEL=""            # Para análisis visual local (opcional)
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
    E -- Rechazada --> D
    D --> I[Generar con FLUX.1-schnell]
    I -- Éxito --> F
    I -- Fallo --> K[Unsplash Stock Fallback]
    K --> L[Imagen Final]
    F --> L[URL Permanente en Supabase]
```

### Gestión de Supabase (StorageService)
Toda imagen aceptada o generada se sube automáticamente a Supabase Storage para evitar enlaces rotos de fuentes externas.

---

## Flujo de IA

El flujo de IA ahora utiliza **AI_PROMPTS** centralizados en `config/prompts.ts`.

### Postprocesado

El postprocesado ortográfico en local mediante Ollama ha sido **desactivado** para habilitar la ejecución serverless en la nube, optimizando el tiempo y dependiendo exclusivamente del modelo `gemini-2.5-flash` para la generación y coherencia. Ollama sigue disponible como opción para entornos locales con GPU.

---

## Gestión de Memoria (VRAM)

El `VRAMManager` gestiona la memoria de GPU para entornos con hardware limitado, alternando entre Ollama y Flux.1 cuando ambos están configurados localmente. En entornos cloud/serverless, este módulo no realiza operaciones activas pero permanece disponible.

---

## Automatización y Flujo Temporal

La ejecución automática se orquesta mediante **GitHub Actions** en contenedores efímeros bajo demanda:

| Proceso | Frecuencia | Orquestador | Comando Ejecutado |
|---------|------------|-------------|-------------------|
| **Publicación automática** | Cada 4 horas (`0 */4 * * *`) | GitHub Actions | `./publicar.sh` |
| **Envío de Newsletter** | Semanal | GitHub Actions (workflow_dispatch) | `./enviar_newsletter.sh` |
| **Ejecución de Prueba** | Manual | GitHub Actions (`workflow_dispatch`) | `./publicarprueba.sh` |
