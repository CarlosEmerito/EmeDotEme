# Documentación Técnica - EmeDotEme

Bienvenido a la documentación oficial de **EmeDotEme**, el sistema automatizado de generación y publicación de noticias.

## 📌 Tabla de Contenidos

1.  **Fundamentos**
    *   [[01 - Arquitectura]] - Visión general del sistema y diagramas.
    *   [[02 - Stack Tecnológico]] - Tecnologías, frameworks y servicios utilizados.
2.  **Referencia del Sistema**
    *   [[03 - Módulos]] - Detalle de la lógica de negocio por módulos.
    *   [[04 - Flujos de Trabajo]] - Explicación de los pipelines de publicación e imágenes.
    *   [[05 - Configuración]] - Variables de entorno y configuración de base de datos.
    *   [[06 - Scripts]] - Catálogo de scripts de automatización y mantenimiento.
3.  **Guías de Desarrollo**
    *   [[07 - Guía de Desarrollo]] - Cómo contribuir, añadir fuentes y crear nuevas funciones.
    *   [[08 - API]] - Documentación de los endpoints internos.
    *   [[09 - Troubleshooting]] - Solución a problemas comunes y depuración.

---

## 🚀 Inicio Rápido

Para poner en marcha el proyecto localmente en menos de 5 minutos:

1.  **Instalar dependencias:** `npm install` y `pip install -r requirements.txt`.
2.  **Configurar entorno:** Copia `.env.example` a `.env` y rellena las claves mínimas (DATABASE_URL, GEMINI_API_KEY).
3.  **Base de datos:** `npx prisma migrate dev`.
4.  **Ejecutar dev:** `npm run dev`.
5.  **Probar pipeline:** `npx tsx scripts/publish_test.ts`.

---

## 🛠️ Uso Recomendado

Esta documentación está optimizada para ser visualizada en **Obsidian**. Utiliza los enlaces `[[ ]]` para navegar entre los diferentes módulos y secciones.
