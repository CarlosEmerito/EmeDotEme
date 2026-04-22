# Stack Tecnológico de EmeDotEme

## Núcleo

- **Runtime**: Node.js v22
- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL

## ORM y Base de datos

- **Prisma**: ORM principal.
- **PostgreSQL**: Base de datos relacional.

## IA y Machine Learning

| Servicio         | Uso                        | API/Local                |
|------------------|---------------------------|--------------------------|
| Gemini (Google)  | Generación de texto       | API externa              |
| Ollama           | Fallback y post-procesado | Local (localhost:11434)  |
| Gemini Vision    | QA de imágenes            | API externa              |
| Ollama Vision    | QA de imágenes fallback   | Local                    |
| AI Horde         | Generación de imágenes    | API externa              |

## Imágenes y almacenamiento

- **AI Horde**: Generación de imágenes (Stable Diffusion).
- **Supabase Storage**: Almacenamiento de imágenes.
- **Unsplash**: Imágenes de stock (fallback).

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