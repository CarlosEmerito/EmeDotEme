# EMEDOTEME

[![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-5a67d8?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

EmeDotEme es un medio de noticias sobre criptomonedas, mercados, tecnología, inteligencia artificial y ciberseguridad. El contenido se produce con un pipeline automatizado que lee fuentes RSS, agrupa las noticias por tema y redacta un artículo bilingüe (ES/EN) con Gemini.

El pipeline **no publica por su cuenta**: guarda el artículo como borrador y lo envía por Telegram al responsable editorial, que lo aprueba o lo descarta. Solo tras la aprobación se sirve en la web y se anuncia en Binance Square, Telegram y Bluesky.

---

## Documentación

*   **[Índice de Documentación](docs/00 - Índice.md)**
*   **[Arquitectura del Sistema](docs/01 - Arquitectura.md)**
*   **[Aprobación Editorial](docs/12 - Aprobación Editorial.md)**
*   **[Guía de Desarrollo](docs/07 - Guía de Desarrollo.md)**
*   **[Referencia de la API](docs/08 - API.md)**

---

## Cómo funciona

-   **Fuentes y agrupación**: 23 fuentes RSS (`modules/news/news-sources.service.ts`), deduplicadas y agrupadas por tema (`modules/news/clustering.ts`).
-   **Generación**: redacción bilingüe ES/EN con Gemini (`modules/ai/`), con `responseSchema` y validación `zod`.
-   **Imágenes**: cascada fotografía con licencia (Pixabay) → imagen generada (Cloudflare Workers AI, FLUX.1-schnell) → imagen de reserva del proyecto. Cada candidata pasa un control de calidad con Gemini Vision.
-   **Aprobación**: el artículo se guarda como borrador (`published = false`) con un enlace privado `/preview/<token>` y tres botones en Telegram.
-   **Distribución**: la siguiente ejecución del publicador anuncia el artículo aprobado en Binance Square, Telegram y Bluesky.
-   **Automatización**: GitHub Actions ejecuta `publicar.sh` cada 4 horas.
-   **Newsletter semanal** para suscriptores.

---

## Scripts principales

-   **Publicación diaria**: `./publicar.sh` (anuncia lo aprobado pendiente y genera el borrador del día).
-   **Pipeline en Node**: `npx tsx scripts/publish.ts`.
-   **Prueba sin persistencia**: `npx tsx scripts/publish_test.ts`.
-   **Catálogo completo**: ver [Scripts](docs/06 - Scripts.md).

---

## Calidad

-   **Logs**: eventos del pipeline en `logs/emedoteme.log`.
-   **QA de imágenes**: control de coherencia y calidad con Gemini Vision antes de aceptar cada imagen.
-   **Tests**: `npm test` (unitarios) y `npm run test:integration`.
-   **CI**: lint, typecheck, tests y build en cada PR (`.github/workflows/ci.yml`).

---

## Contribuir

Lee antes la **[Guía de Desarrollo](docs/07 - Guía de Desarrollo.md)**.

---

## Licencia

Uso restringido bajo condiciones internas de EMEDOTEME. Todos los derechos reservados.
