# Guía de Desarrollo - EmeDotEme

Esta guía proporciona instrucciones para desarrolladores que deseen ampliar o mantener el sistema.

## 🛠️ Entorno de Desarrollo

### Requisitos previos
- Node.js v22+
- Python 3.10+
- PostgreSQL
- Ollama (opcional, para ejecución local de IA)

### Instalación
1.  Clonar el repositorio.
2.  Instalar dependencias de Node: `npm install`.
3.  Instalar dependencias de Python: `pip install -r scripts/python/requirements.txt`.
4.  Configurar el archivo `.env` (ver [[05 - Configuración]]).
5.  Inicializar la base de datos: `npx prisma migrate dev`.

---

## 📰 Cómo añadir una nueva fuente de noticias

Las fuentes se gestionan en `modules/news/news-sources.service.ts`.

1.  Abre `modules/news/news-sources.service.ts`.
2.  Busca el array `NEWS_SOURCES`.
3.  Añade un nuevo objeto con el siguiente formato:
    ```typescript
    {
      url: 'https://ejemplo.com/rss',
      source: 'Nombre de la Fuente',
      priority: 1, // 1: alta, 2: media, 3: baja
      category: 'Tecnología' // Debe coincidir con las categorías de la BD
    }
    ```
4.  Prueba el fetch: `npx tsx scripts/publish_test.ts`.

---

## 🤖 Modificar el comportamiento de la IA

La lógica de la IA reside en `modules/ai/`.

### Cambiar el System Prompt
Si deseas ajustar el tono o estilo de los artículos, modifica los prompts en `config/prompts.ts`. Los system prompts de Gemini están en `modules/ai/constants.ts`.

### Añadir un nuevo modelo de Ollama
1.  Asegúrate de haber descargado el modelo: `ollama pull nuevo-modelo`.
2.  Actualiza `OLLAMA_MODEL` en tu `.env`.

---

## 🎨 Personalizar el Pipeline de Imágenes

El pipeline de imágenes está en `modules/images/image.service.ts`.

### Añadir nuevas imágenes de fallback
Si quieres cambiar las imágenes que se usan cuando falla la generación por IA:
1.  Edita `config/constants.ts`.
2.  Actualiza el objeto `FALLBACK_IMAGES` con nuevas URLs de Unsplash u otros servicios.

---

## 🧪 Testing

El proyecto utiliza un enfoque de testing pragmático.

- **Pruebas unitarias**: Ubicadas en `tests/`. Incluyen tests para admin-actions, analytics, json-sanitizer, utils, y contact-route. Ejecutar con `npx tsx <test-file>`.
- **Benchmarks**: `npm run test:bench` para medir rendimiento de fuentes RSS.
- **Pruebas de integración**: `npx tsx scripts/publish_test.ts` simula un ciclo completo de publicación sin afectar a la base de datos ni publicar en redes sociales.

---

## 🚀 Despliegue

### Vercel
El frontend y las rutas API se despliegan automáticamente en Vercel al hacer push a `main`.

### Tareas Programadas (Cron)
Para la automatización de la publicación diaria, se recomienda usar **cron-job.org** apuntando a un endpoint protegido de la API o ejecutar el script vía una GitHub Action/servidor propio:
```bash
npx tsx scripts/publish.ts
```

---

## 📜 Convenciones de Código

- **TypeScript**: Estricto. Evitar el uso de `any`.
- **Commits**: Seguir el estándar de [Conventional Commits](https://www.conventionalcommits.org/).
- **Documentación**: Actualizar los archivos en `docs/` ante cualquier cambio estructural.
