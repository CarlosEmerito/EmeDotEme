# EMEDOTEME - Portal de Noticias Inteligente

[![Next.js](https://img.shields.io/badge/Next.js-16.2.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-5a67d8?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
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

-   **Pipeline de IA Multicanal**: Generación de texto bilingüe (ES/EN) con Gemini (Google) y fallback local con Ollama.
-   **Curación Inteligente**: Obtención y filtrado automático de noticias desde fuentes RSS de alta fiabilidad.
-   **Generación de Imágenes de Alta Calidad**: Motor local **Flux.1 [dev]** optimizado para 8GB VRAM, con fallback automático a AI Horde.
-   **Publicación Unificada**: Distribución automática en Binance Square, Telegram, Bluesky y Web.
-   **Automatización Total**: Scripts de gestión para encendido/apagado unificado de bots y motores de IA.
-   **Newsletter Semanal**: Generación y envío automático de boletines informativos a suscriptores.

---

## 🛠️ Servidor de IA Local (Flux.1)

El sistema ahora soporta generación de imágenes local para máxima calidad sin depender de servicios externos.

### Requisitos de Hardware
- GPU NVIDIA con al menos 8GB VRAM (optimizado para RTX 4060).
- Docker instalado.

### Puesta en marcha
1. **Iniciar IA y Bot**:
   ```bash
   ./iniciar-bot.sh
   ```
   *Este comando levanta tanto el servicio de imágenes Flux.1 como el bot de publicación automática.*

2. **Detener todo**:
   ```bash
   ./detener-bot.sh
   ```
   *Apaga el bot y libera la VRAM de la tarjeta gráfica.*

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
