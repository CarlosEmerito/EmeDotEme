# Flujos de Trabajo de EmeDotEme

## Índice

- Pipeline de generación de borradores (Publisher Service)
- Flujo de imágenes
- Flujo de IA
- Cron jobs

---

## Pipeline de generación de borradores

### Descripción general

Es el flujo principal. Cada ejecución genera un artículo a partir de fuentes RSS y lo guarda como **borrador** (`published = false`). El pipeline **no publica**: manda la petición de aprobación a Telegram y espera la decisión humana (ver [[12 - Aprobación Editorial]]). Está implementado como **Publisher Service** para separar la orquestación de los scripts.

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

    Step4["<b>4. PROCESO DE IMAGEN</b><br/><i>(Image Service)</i><br/>- Pixabay -> Cloudflare FLUX -> reserva<br/>- QA Gemini Vision en cada paso"]:::step --> Step5

    Step5["<b>5. GUARDAR BORRADOR</b><br/><i>(Base de Datos)</i><br/>- published = false<br/>- reviewToken aleatorio"]:::step --> Step6

    Step6["<b>6. PEDIR APROBACIÓN</b><br/><i>(Telegram)</i><br/>- Mensaje con enlace privado<br/>- Botones Sí / No / EmeDotHermes"]:::alert

    Step6 --> End((Espera decisión)):::init
```

### Código de ejecución

```bash
# El script principal es un wrapper del PublisherService
npx tsx scripts/publish.ts
```

---

## Flujo de imágenes

### Pipeline de imagen detallado

```mermaid
graph TD
    A[Inicio: Datos del Artículo] --> G[1. Buscar en Pixabay]
    G -- Aprobada --> F[Subir a Supabase]
    G -- Rechazada o sin resultados --> H[2. Generar con Cloudflare + FLUX.1-schnell]
    H -- Aprobada --> F
    H -- Rechazada o sin cuota --> I[3. Imagen de reserva de la categoría]
    I --> F
    F --> L[URL Permanente en Supabase]
```

> [!IMPORTANT]
> **No se usan imágenes de prensa.** Los dos primeros pasos de las versiones anteriores (`og:image` del artículo original e imagen del feed RSS) se han eliminado: el art. 129 bis.2 del TRLPI exige autorización para poner a disposición del público imágenes de publicaciones de prensa. La referencia a la fuente original se hace **enlazándola** (`SourceAttribution`), no copiándola.

### Gestión de Supabase (StorageService)
Toda imagen aceptada o generada se sube automáticamente a Supabase Storage para evitar enlaces rotos. **Solo se re-alojan imágenes propias o con licencia**: `isAllowedToStore()` (`modules/storage/supabase.service.ts`) deja pasar los Data URI de la generación con IA, las fuentes con licencia comercial (Pixabay, Pexels, Unsplash) y el propio almacén; cualquier otro origen se devuelve sin copiar y se avisa en los logs.

### Nunca se descarta el artículo

`generateArticleImageAndAnalyzeQA` (`modules/images/image.service.ts`) recorre la cascada y **no lanza ninguna excepción**: si ninguna candidata supera el control de calidad, devuelve la imagen de reserva de la categoría (`config/constants.ts`) y el artículo se guarda igualmente como borrador.

### Control de calidad

Cada candidata pasa por Gemini Vision antes de aceptarse (`isImageValid`). Ese filtro es el suelo de calidad real del proyecto y es **independiente del origen de la imagen**: una foto de archivo mediocre se rechaza exactamente igual que una generación mediocre.

El orden de la cascada va de mejor a peor calidad editorial: una foto real del suceso siempre será preferible a una imagen inventada por IA.

### Pie de foto y origen

El pie de foto lo redacta el control de calidad a partir de lo que muestra la imagen y **no menciona su procedencia**. El origen (Pixabay / generada / reserva) se informa a quien aprueba, en el mensaje de Telegram. `pickFallbackImage` rota por el pool de la categoría para no repetir la misma imagen en artículos consecutivos.

---

## Flujo de IA

El flujo de IA utiliza **AI_PROMPTS** centralizados en `config/prompts.ts`.

### Postprocesado

Toda la generación y postprocesado ortográfico depende exclusivamente del modelo `gemini-2.5-flash`, para habilitar la ejecución serverless en la nube sin dependencias locales.

---

## Automatización y Flujo Temporal

La ejecución automática se orquesta mediante **GitHub Actions** en contenedores efímeros bajo demanda:

| Proceso | Frecuencia | Orquestador | Comando Ejecutado |
|---------|------------|-------------|-------------------|
| **Generación de borrador + anuncio de lo aprobado** | Cada 4 horas (`0 */4 * * *`) | GitHub Actions | `./publicar.sh` |
| **Envío de Newsletter** | Semanal | GitHub Actions (workflow_dispatch) | `./enviar_newsletter.sh` |
| **Ejecución de Prueba** | Manual | GitHub Actions (`workflow_dispatch`) | `./publicarprueba.sh` |

`publicar.sh` hace dos cosas en orden: primero anuncia en redes el artículo aprobado pendiente (si lo hay) y después genera el borrador del día. El detalle está en [[06 - Scripts]] y [[12 - Aprobación Editorial]].
