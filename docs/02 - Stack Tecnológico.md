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
| Gemini (Google)  | Generación de texto       | API externa              | gemini-2.5-flash |
| Ollama           | Fallback y post-procesado | Local (localhost:11434)  | llama3.1:8b (soporta tokens 'thinking') |
| Gemini Vision    | QA de imágenes            | API externa              | gemini-2.5-flash |
| Ollama Vision    | QA de imágenes fallback   | Local                    | gemma4:e4b |
| Flux.1 Local     | Generación de imágenes    | Local (Docker/Python)    | Flux.1-dev optimizado (8GB VRAM) |
| AI Horde         | Generación fallback       | API externa              | Stable Diffusion |

## Imágenes y almacenamiento

- **Flux.1 Local**: Generador principal de imágenes (vía `flux-api` Docker).
- **AI Horde**: Generación de imágenes de respaldo.
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