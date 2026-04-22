# Arquitectura de EmeDotEme

## Visión general

EmeDotEme es un sistema automatizado para la generación y publicación de artículos de noticias sobre criptomonedas, blockchain, tecnología e inteligencia artificial.

## Diagrama de arquitectura

```
+-------------------------------------------------------------+
|                        FRONTEND (Next.js)                  |
|  +------------+  +------------+  +------------+  +--------+|
|  |  Página    |  |   Admin    |  |    API     |  |  RSS/  ||
|  | Principal  |  |   Panel    |  |  Routes    |  |  Feeds ||
|  +------------+  +------------+  +------------+  +--------+|
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                          BACKEND                            |
|  +-----------------------------------------------------+    |
|  |          BASE DE DATOS (PostgreSQL + Prisma)         |    |
|  |  Articles, Categories, Subscribers, Analytics         |    |
|  +-----------------------------------------------------+    |
|                                                           |
|  +-----------------------------------------------------+   |
|  |        PIPELINE DE CONTENIDO (scripts/publish.ts)    |   |
|  +-----------------------------------------------------+   |
|                            |                              |
|         +------------------+--+-------------------+        |
|         v                  v                  v             |
|  +-----------+    +-----------+    +-----------+           |
|  |   News    |    |    IA     |    |  Imágenes  |           |
|  |  Sources  |--->|  Service  |--->|  Service   |           |
|  +-----------+    +-----------+    +-----------+           |
|                            |                |              |
|         +------------------+--+---------+     |            |
|         v                  v              v                |
|  +-----------+    +-----------+    +-----------+           |
|  |  Gemini   |    |  Ollama   |    | AI Horde  |           |
|  |  (API)    |    |  (Local)  |    |  (API)    |           |
|  +-----------+    +-----------+    +-----------+           |
+-------------------------------------------------------------+
```

## Componentes principales

### Frontend (Next.js)
- **Páginas**: Inicio, artículos, categorías.
- **Panel de administración**: Gestión de contenido.
- **Rutas API**: Endpoints para generación y suscripción.
- **Feeds**: RSS y Atom.

### Base de datos
- PostgreSQL con Prisma ORM.
- Tablas: Articles, Categories, Subscribers, Analytics.

### Pipeline de contenido
- Servicio de fuentes de noticias: Fetch de RSS.
- Servicio de IA: Generación de artículos.
- Servicio de imágenes: Pipeline de imágenes.

## Referencias

- [[02 - Stack Tecnológico]]
- [[04 - Flujos de Trabajo]]