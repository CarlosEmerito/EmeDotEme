# Stack Tecnológico de EmeDotEme

## Núcleo

- **Runtime**: Node.js v22
- **Framework**: Next.js 16.2.2 (App Router)
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL

## ORM y Base de datos

- **Prisma**: ORM principal.
- **PostgreSQL**: Base de datos relacional.

## IA y Machine Learning

| Servicio         | Uso                        | API/Local                | Notas |
|------------------|---------------------------|--------------------------|-------|
| Gemini (Google)  | Generación de texto       | API externa              | gemini-2.5-flash (con reintentos de alta demanda 30s/60s/120s y rotación de 3 claves) |
| Hugging Face     | Generación de imágenes    | API externa              | FLUX.1-schnell (API Inference) |
| Gemini Vision    | QA de imágenes            | API externa              | gemini-2.5-flash |
| Ollama           | Fallback local opcional   | Local                    | qwen3.5:9b (cuando está disponible) |
| Ollama Vision    | QA local de imágenes      | Local                    | Opcional |
| Flux.1 Local     | Generación local          | Docker local             | Requiere GPU NVIDIA 8GB+ VRAM |
| AI Horde         | Fallback imagen comunitario | API externa            | Requiere AI_HORDE_API_KEY |

## Imágenes y almacenamiento

- **Hugging Face**: Generador principal de imágenes (modelo `FLUX.1-schnell` mediante API Inference).
- **Supabase Storage**: Almacenamiento permanente de imágenes analizadas y aprobadas.
- **Unsplash**: Imágenes de stock (fallback inicial).

## RSS y Feeds

- **rss-parser**: Parseo de feeds RSS.

## Despliegue

- **Vercel**: Hosting principal.
- **Cron**: Programación de tareas (cron-job.org).

## Variables de entorno

Consulta [[05 - Configuración]] para la configuración completa.

## Referencias

- [[01 - Arquitectura]]
- [[05 - Configuración]]