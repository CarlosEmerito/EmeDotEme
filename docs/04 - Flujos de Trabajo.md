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
> A diferencia de versiones anteriores, **no existen modelos por defecto** para Ollama. Si no están en el `.env`, el sistema fallará explícitamente para garantizar el control del desarrollador.

```env
OLLAMA_MODEL="gemma4:26b"         # Para generación de texto y corrección
OLLAMA_VISION_MODEL="gemma4:e4b"  # Para análisis visual (Vision)
```

---

## Flujo de imágenes

### Pipeline de imagen detallado

```mermaid
graph TD
    A[Inicio: Datos del Artículo] --> B{¿Hay Imagen RSS?}
    B -- Sí --> E[QA Gemini/Ollama Vision]
    B -- No --> D
    E -- Aprobada --> F[Subir a Supabase]
    E -- Rechazada --> D[Flux Local]
    D --> G{¿Flux Online?}
    G -- Sí --> H[VRAM: Unload Ollama]
    H --> I[Generar con Flux.1]
    G -- No --> J[AI Horde Fallback]
    I -- Éxito --> F
    I -- Fallo --> J
    J -- Éxito --> F
    J -- Fallo --> K[Unsplash Stock Fallback]
    K --> L[Imagen Final]
    F --> L[URL Permanente en Supabase]
```

### Gestión de Supabase (StorageService)
Toda imagen aceptada o generada se sube automáticamente a Supabase Storage para evitar enlaces rotos de fuentes externas.

---

## Flujo de IA

El flujo de IA ahora utiliza **AI_PROMPTS** centralizados en `config/prompts.ts`.

### Postprocesado

El postprocesado ortográfico es obligatorio y se realiza mediante Ollama en local tras la generación del contenido en español, asegurando la calidad de nombres propios y siglas antes de proceder a la traducción al inglés.

---

## Gestión de Memoria (VRAM)

Dada la limitación de VRAM (ej. 8GB), el `VRAMManager` centraliza el control:

1.  **Keep Alive 0**: Todas las llamadas a Ollama liberan memoria inmediatamente.
2.  **Unload Explícito**: Antes de usar Flux, se fuerza la descarga de Ollama.
3.  **Pausas de Estabilización**:
    *   **8s**: Limpieza física de buffers del driver NVIDIA.
    *   **5s**: Estabilización previa a la carga de Flux.

---

## Cron jobs

| Job                 | Frecuencia         | Script                      |
|---------------------|-------------------|-----------------------------|
| Publicación diaria  | 1x día (8:00 UTC) | `scripts/publish.ts`        |
| Newsletter semanal  | 1x semana         | `scripts/send_newsletter.ts`|
