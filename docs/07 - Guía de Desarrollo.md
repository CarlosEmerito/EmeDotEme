# Guía de Desarrollo - EmeDotEme

Esta guía proporciona instrucciones para desarrolladores que deseen ampliar o mantener el sistema.

## Entorno de Desarrollo

### Requisitos previos
- Node.js v22+
- Python 3.10+
- PostgreSQL

### Instalación
1.  Clonar el repositorio.
2.  Instalar dependencias de Node: `npm install`.
3.  Instalar dependencias de Python: `pip install -r scripts/python/requirements.txt`.
4.  Configurar el archivo `.env` (ver [[05 - Configuración]]).
5.  Inicializar la base de datos: `npx prisma migrate dev`.

---

## Cómo añadir una nueva fuente de noticias

Las fuentes se gestionan en `modules/news/news-sources.service.ts`.

1.  Abre `modules/news/news-sources.service.ts`.
2.  Busca el array `NEWS_SOURCES`.
3.  Añade un nuevo objeto con el siguiente formato:
    ```typescript
    {
      name: 'Nombre de la Fuente',
      slug: 'nombre-de-la-fuente',
      url: 'https://ejemplo.com/rss',
      language: 'en',            // 'en' | 'es'
      reliability: 'high',       // 'high' | 'medium'
      enabled: true,
    }
    ```
4.  Prueba el fetch: `npx tsx scripts/publish_test.ts`.

---

## Modificar el comportamiento de la IA

La lógica de la IA reside en `modules/ai/`.

### Cambiar el System Prompt
Si deseas ajustar el tono o estilo de los artículos, modifica los prompts en `config/prompts.ts`. Los prompts de análisis de imagen están en `modules/ai/constants.ts`.

Si el cambio añade, quita o renombra un campo en el JSON que devuelve la IA (p. ej. un nuevo campo en el artículo), actualiza también `modules/ai/schemas.ts` en el mismo cambio: el `responseSchema` que se envía a Gemini y el esquema `zod` que valida la respuesta al vuelo. Si solo tocas el prompt y no el schema, Gemini seguirá forzando la forma antigua y el campo nuevo no llegará. Ver [[10 - Seguridad y Prompts de IA]] para el porqué de este diseño (incluye las defensas anti prompt-injection, que conviene mantener si tocas `USER_WITH_NEWS`).

---

## Personalizar el Pipeline de Imágenes

El pipeline de imágenes está en `modules/images/image.service.ts`.

### Cambiar las imágenes de reserva
El pool de reserva está en `config/constants.ts` (`FALLBACK_IMAGES`, por categoría). `pickFallbackImage` rota por el pool para no repetir la misma imagen en artículos consecutivos.

### Cambiar los escalones de la cascada
La cascada (Pixabay → Cloudflare FLUX → reserva) y su control de calidad están en `modules/images/image.service.ts`. Los clientes de cada fuente viven en `modules/images/stock-image.service.ts` y `modules/ai/cloudflare-image.service.ts`. Cualquier imagen nueva que se añada debe pasar por `isAllowedToStore()` (`modules/storage/supabase.service.ts`) para poder re-alojarse. Ver [[11 - Cumplimiento Legal]] antes de tocar esta parte.

---

## Testing

- **Unitarios**: en `tests/`. Ejecutar con `npm test`. Cubren utilidades, sanitización de JSON, contacto, rate limit, token de baja, imágenes, token de revisión y decisión editorial.
- **Suite completa**: `npm run test:all`.
- **Integración**: `npm run test:integration` (`tests/api/routes.test.ts`).
- **Benchmarks**: `npm run test:bench`.
- **Integración end-to-end**: `npx tsx scripts/publish_test.ts` simula un ciclo completo sin persistir en base de datos ni publicar en redes.

---

## Despliegue

### Vercel
El frontend y las rutas API (incluido el webhook de aprobación) se despliegan automáticamente en Vercel al hacer push a `main`.

### Pipeline programado (GitHub Actions)
La generación de borradores la ejecuta GitHub Actions cada 4 horas mediante `.github/workflows/generate-news.yml`, que corre `./publicar.sh`. En producción conviene aplicar las migraciones nuevas **antes** de desplegar el código (las columnas de revisión las consulta Prisma desde el primer momento).

---

## Convenciones de Código

- **TypeScript**: Estricto. Evitar el uso de `any`.
- **Commits**: Seguir el estándar de [Conventional Commits](https://www.conventionalcommits.org/).
- **Documentación**: Actualizar los archivos en `docs/` ante cualquier cambio estructural.

---

## Referencias

- [[05 - Configuración]]
- [[10 - Seguridad y Prompts de IA]]
- [[12 - Aprobación Editorial]]
