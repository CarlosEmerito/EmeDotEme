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
| Hugging Face     | Generación de imágenes    | API externa              | stable-diffusion-3-medium-diffusers (proveedor `hf-inference`) |
| Gemini Vision    | QA de imágenes            | API externa              | gemini-2.5-flash |

## Imágenes y almacenamiento

- **Hugging Face**: Generador principal de imágenes (modelo `stable-diffusion-3-medium-diffusers` mediante el proveedor `hf-inference`; es el único modelo text-to-image que sirve actualmente ese proveedor — `FLUX.1-schnell` fue deprecado por Hugging Face con HTTP 410).
- **Supabase Storage**: Almacenamiento permanente de imágenes analizadas y aprobadas.

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