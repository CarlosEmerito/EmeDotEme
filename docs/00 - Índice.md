# Documentación Técnica - EmeDotEme

> [!NOTE]
> Bienvenido a la documentación oficial de **EmeDotEme**, el sistema automatizado de generación y publicación de noticias.

## 📌 Tabla de Contenidos

### 1. Fundamentos
*   [[01 - Arquitectura]] - Visión general del sistema, diagrama de flujo de datos y arquitectura de componentes.
*   [[02 - Stack Tecnológico]] - Tecnologías core, frameworks (Next.js), modelos de IA (Gemini, Hugging Face) y servicios externos.

### 2. Referencia del Sistema
*   [[03 - Módulos]] - Detalle técnico y responsabilidades de los módulos de negocio principales (`ai`, `images`, `news`, etc).
*   [[04 - Flujos de Trabajo]] - Diagramas detallados de los pipelines de publicación (Publisher Service) y generación de imágenes.
*   [[05 - Configuración]] - Guía completa de variables de entorno (`.env`), constantes globales y configuración de la base de datos.
*   [[06 - Scripts]] - Catálogo de scripts de shell y Node.js para automatización, publicación y mantenimiento diario.

### 3. Guías de Desarrollo
*   [[07 - Guía de Desarrollo]] - Instrucciones para configurar el entorno local, añadir fuentes RSS y extender la lógica de la IA.
*   [[08 - API]] - Documentación de los endpoints internos para automatizaciones y el frontend, incluyendo ejemplos cURL.
*   [[09 - Troubleshooting]] - Solución a problemas comunes, manejo de errores de cuota y depuración.
*   [[10 - Seguridad y Prompts de IA]] - Sanitización de HTML, defensas anti prompt-injection, `responseSchema`/`zod`, autenticación del panel admin.

---

## 🚀 Inicio Rápido

Para poner en marcha el proyecto localmente:

1.  **Instalar dependencias:** `npm install` y `pip install -r scripts/python/requirements.txt`.
2.  **Configurar entorno:** Copia `.env.example` a `.env` y rellena las claves mínimas (DATABASE_URL, GEMINI_API_KEY, HF_TOKEN).
3.  **Base de datos:** `npx prisma migrate dev`.
4.  **Ejecutar dev:** `npm run dev`.
5.  **Probar pipeline:** `npx tsx scripts/publish_test.ts`.

---

## 🛠️ Uso Recomendado

Esta documentación está optimizada para ser visualizada en **Obsidian**. Utiliza los enlaces `[[ ]]` para navegar entre los diferentes módulos y secciones.
