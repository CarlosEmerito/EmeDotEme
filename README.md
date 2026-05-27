# EMEDOTEME - Portal de Noticias Inteligente

[![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-5a67d8?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

EmeDotEme es una plataforma automatizada de vanguardia diseñada para centralizar la generación, curación y publicación de noticias sobre Criptomonedas, Web3, Tecnología e Inteligencia Artificial. Utilizando pipelines avanzados de IA, el sistema transforma fuentes RSS en artículos profesionales publicados automáticamente en múltiples canales.

---

## 📖 Documentación Completa

Para una comprensión profunda del sistema, consulta nuestra documentación técnica:

*   **[Índice de Documentación](docs/00 - Índice.md)**
*   **[Arquitectura del Sistema](docs/01 - Arquitectura.md)**
*   **[Guía de Desarrollo](docs/07 - Guía de Desarrollo.md)**
*   **[Referencia de la API](docs/08 - API.md)**

---

## 🚀 Características Principales

-   **Pipeline de IA Multicanal**: Generación de texto bilingüe (ES/EN) con Gemini (Google) y fallback local opcional con Ollama.
-   **Curación Inteligente**: Obtención y filtrado automático de noticias desde fuentes RSS de alta fiabilidad.
-   **Generación de Imágenes**: Motor local Flux.1 [dev] (Docker + GPU NVIDIA 8GB VRAM) con fallback automático a Hugging Face y Unsplash.
-   **Publicación Unificada**: Distribución automática en Binance Square, Telegram, Bluesky y Web.
-   **Automatización Total**: Pipeline automatizado vía GitHub Actions cada 4 horas.
-   **Newsletter Semanal**: Generación y envío automático de boletines informativos a suscriptores.

---

## 🛠️ Servidor de IA Local (Flux.1 - Opcional)

La generación local de imágenes usa Flux.1 [dev] para máxima calidad sin depender de servicios externos.

### Requisitos de Hardware
- GPU NVIDIA con al menos 8GB VRAM (optimizado para RTX 4060).
- Docker instalado.

### Puesta en marcha
1. **Iniciar el servidor de imágenes**:
   ```bash
   cd flux-api && docker compose up -d
   ```
2. **Publicar artículo**:
   ```bash
   ./publicar.sh
   ```

---

## 📤 Automatización y Scripts

El sistema incluye scripts robustos para la operación diaria:

-   **Publicación Diaria**: `npx tsx scripts/publish.ts`
-   **Prueba de Pipeline**: `npx tsx scripts/publish_test.ts`
-   **Mantenimiento**: Ver [Catálogo de Scripts](docs/06 - Scripts.md).

---

## 🧪 Calidad y Robustez

-   **Logs Centralizados**: Todos los eventos técnicos se registran en `logs/emedoteme.log`.
-   **Auditoría Social**: Registro de publicaciones en `logs/historial_publicaciones.csv`.
-   **QA de Imágenes**: Verificación automática de calidad y coherencia mediante modelos de visión.

---

## 🧑‍💻 Contribuir

Si deseas contribuir al proyecto, por favor lee la **[Guía de Desarrollo](docs/07 - Guía de Desarrollo.md)**.

---

## ⚖️ Licencia

Uso restringido bajo condiciones internas de EMEDOTEME. Todos los derechos reservados.
