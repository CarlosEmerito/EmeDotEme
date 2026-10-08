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
- **Cloudflare Workers AI**: generación con FLUX.1-schnell. La asignación gratuita es de 10.000 neurons/día (~170 imágenes). El origen de la imagen no se declara en la web: el pie de foto describe la imagen y el origen se informa a quien la aprueba en el mensaje de Telegram.
- **Imagen de reserva** (`config/constants.ts`): última red para no perder el artículo.
- **Supabase Storage**: almacenamiento permanente de las imágenes aprobadas. **Solo se re-alojan imágenes propias o con licencia**; `isAllowedToStore()` (`modules/storage/supabase.service.ts`) rechaza cualquier otro origen.

> [!IMPORTANT]
> **Ya no se usan imágenes de prensa.** Las versiones anteriores tomaban la imagen del `og:image` del artículo original o del feed RSS. El artículo 129 bis.2 del TRLPI sujeta a autorización la puesta a disposición del público de cualquier imagen de una publicación de prensa, sin excepción de extractos. A la fuente original se la **enlaza** (`SourceAttribution`), que es la vía correcta: el hiperenlace está expresamente excluido de ese derecho (art. 129 bis.6).

## RSS y Feeds

- **rss-parser**: Parseo de feeds RSS.

## Despliegue

- **Vercel**: Hosting del frontend y de las rutas API (incluido el webhook de Telegram).
- **GitHub Actions**: Orquestación del pipeline programado (`generate-news.yml`, cada 4 horas).

## Variables de entorno

Consulta [[05 - Configuración]] para la configuración completa.

## Referencias

- [[01 - Arquitectura]]
- [[05 - Configuración]]
