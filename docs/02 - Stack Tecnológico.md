# Stack Tecnológico EmeDotEme

## Core

- **Runtime**: Node.js v22
- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL

## ORM & DB

- **Prisma**: ORM principal
- **PostgreSQL**: Base de datos relacional

## AI & ML

| Servicio | Uso | API/Local |
|----------|-----|----------|
| Gemini (Google) | Generación de texto principal | API externa |
| Ollama | Fallback y post-procesado | Local (localhost:11434) |
| Gemini Vision | QA de imágenes | API externa |
| Ollama Vision | QA de imágenes fallback | Local |
| AI Horde | Generación de imágenes | API externa |

## Imágenes & Storage

- **AI Horde**: Generación de imágenes (Stable Diffusion)
- **Supabase Storage**: Almacenamiento de imágenes
- **Unsplash**: Imágenes de stock fallback

## RSS & Feeds

- **rss-parser**: Parseo de feeds RSS

## Deployment

- **Vercel**: Hosting principal
- **Cron**: Programación de tareas (cron-job.org)

## Variables de Entorno

Ver [[Variables de Entorno]] para configuración completa.

## Referencias
- [[Arquitectura del Proyecto]]
- [[Configuración]]