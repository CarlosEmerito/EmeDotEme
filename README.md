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

-   **Pipeline de IA Multicanal**: Generación de texto con Gemini (Google) y fallback local con Ollama.
-   **Curación Inteligente**: Obtención y filtrado automático de noticias desde fuentes RSS de alta fiabilidad.
-   **Generación de Imágenes**: Creación de visuales únicos mediante AI Horde (Stable Diffusion) con QA mediante visión artificial.
-   **Publicación Unificada**: Distribución automática en Binance Square, Telegram, Bluesky y Web.
-   **Newsletter Semanal**: Generación y envío automático de boletines informativos a suscriptores.

---

## 🛠️ Instalación Rápida

### Requisitos
- Node.js v22
- Python 3.10+
- PostgreSQL

### Pasos
1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/usuario/emedoteme.git
    cd emedoteme
    ```
2.  **Instalar dependencias**:
    ```bash
    npm install
    pip install -r requirements.txt
    ```
3.  **Configurar entorno**:
    Copia `.env.example` a `.env` y añade tus credenciales.
4.  **Inicializar base de datos**:
    ```bash
    npx prisma migrate dev
    ```
5.  **Iniciar en desarrollo**:
    ```bash
    npm run dev
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
