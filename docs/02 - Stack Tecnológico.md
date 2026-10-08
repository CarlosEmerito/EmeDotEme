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

- **Pixabay**: fotografía de archivo con licencia comercial, sin atribución y apta para servirse desde almacenamiento propio. Es el primer paso porque una foto real con licencia es mejor que cualquier imagen generada.
- **Cloudflare Workers AI**: generación con FLUX.1-schnell. Sustituye a Hugging Face, cuya capa gratuita dejó de cubrir el proyecto (HTTP 402, créditos agotados). La asignación gratuita de Cloudflare es permanente: 10.000 neurons/día, ~170 imágenes. Cuando la imagen es generada, el pie de foto lo dice expresamente.
- **Imagen de reserva** (`config/constants.ts`): última red para no perder el artículo.
- **Supabase Storage**: almacenamiento permanente de las imágenes aprobadas. **Solo se re-alojan imágenes propias o con licencia**; `isAllowedToStore()` (`modules/storage/supabase.service.ts`) rechaza cualquier otro origen.

> [!IMPORTANT]
> **Ya no se usan imágenes de prensa.** Las versiones anteriores tomaban la imagen del `og:image` del artículo original o del feed RSS. El artículo 129 bis.2 del TRLPI sujeta a autorización la puesta a disposición del público de cualquier imagen de una publicación de prensa, sin excepción de extractos. A la fuente original se la **enlaza** (`SourceAttribution`), que es la vía correcta: el hiperenlace está expresamente excluido de ese derecho (art. 129 bis.6).

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