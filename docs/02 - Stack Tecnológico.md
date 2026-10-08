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
| Cloudflare       | Generación de imágenes    | API externa              | Workers AI, `@cf/black-forest-labs/flux-1-schnell` (plan gratuito: 10.000 neurons/día) |
| Pixabay          | Fotografía de archivo     | API externa              | Fotos con licencia comercial, sin atribución |
| Gemini Vision    | QA de imágenes            | API externa              | gemini-2.5-flash |

## Imágenes y almacenamiento

El pipeline de imagen prueba varias fuentes **en cascada** y se queda con la primera que supere el control de calidad (ver [[04 - Flujos de Trabajo]]):

- **og:image del artículo original**: la foto real del suceso. Es la mejor opción editorial y cubre ~85% de los casos medidos sobre las fuentes del proyecto. Se extrae de `og:image`, `twitter:image` o JSON-LD (`modules/images/source-image.service.ts`).
- **Imagen del feed RSS**: cuando el propio feed la incluye (`media:content`, `media:thumbnail`, `enclosure`).
- **Pixabay**: fotografía de archivo con licencia comercial, sin atribución y apta para servirse desde almacenamiento propio.
- **Cloudflare Workers AI**: generación con FLUX.1-schnell. Sustituye a Hugging Face, cuya capa gratuita dejó de cubrir el proyecto (HTTP 402, créditos agotados). La asignación gratuita de Cloudflare es permanente: 10.000 neurons/día, ~170 imágenes.
- **Imagen de reserva** (`config/constants.ts`): última red para no perder el artículo.
- **Supabase Storage**: almacenamiento permanente de las imágenes aprobadas.

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