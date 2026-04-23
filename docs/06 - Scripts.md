# Scripts de EmeDotEme

## Índice de scripts

| Script                | Descripción                        |
|-----------------------|------------------------------------|
| `publish.ts`          | Pipeline principal                 |
| `force-generate.ts`   | Forzar generación                  |
| `publish_test.ts`     | Modo prueba                        |
| `send_newsletter.ts`  | Newsletter                         |

---

## Scripts de Publicación en Redes Sociales (Python)

Ubicados en `scripts/python/`, estos scripts publican el contenido generado en diversas plataformas. Se integran con el pipeline de Node.js a través de scripts de shell.

| Script                | Descripción                        |
|-----------------------|------------------------------------|
| `publish_telegram.py` | Publica en el canal de Telegram    |
| `publish_twitter.py`  | Publica en X (Twitter)             |
| `publish_bluesky.py`  | Publica en Bluesky                 |
| `publish_direct.py`   | Publicación directa general        |
| `send_private_test.py`| Envía al grupo de Telegram privado |

---

## publish.ts

**Ubicación**: `scripts/publish.ts`

### Descripción

Pipeline principal de generación y publicación automática de artículos.

### Uso

```bash
# Con tsx (más rápido)
npx tsx scripts/publish.ts
```

### Flujo

1. Inicialización (categorías, artículos recientes)
2. Obtención de noticias desde fuentes RSS
3. Generación IA (Gemini → Ollama → fallback)
4. Traducción y postprocesado
5. Pipeline de imagen
6. Guardar en base de datos
7. Publicar en redes (opcional)

### Dependencias

- `modules/news/news-sources.service`
- `modules/ai/ai.service`
- `modules/images/image.service`
- `@prisma/client`

### Errores

- Si todas las IAs fallan → Avisa por Telegram + exit(1)
- Si el pipeline de imagen falla → Usa fallback de Unsplash

### Referencias

- [[04 - Flujos de Trabajo]]

---

## force-generate.ts

**Ubicación**: `scripts/force-generate.ts`

### Descripción

Fuerza la generación de un artículo, omitiendo las verificaciones de duplicados.

### Uso

```bash
npx tsx scripts/force-generate.ts
```

---

## publish_test.ts

**Ubicación**: `scripts/publish_test.ts`

### Descripción

Versión de prueba del pipeline sin publicar en la base de datos.

### Uso

```bash
npx tsx scripts/publish_test.ts
```

---

## send_newsletter.ts

**Ubicación**: `scripts/send_newsletter.ts`

### Descripción

Genera y envía el newsletter semanal a los suscriptores.

### Uso

```bash
npx tsx scripts/send_newsletter.ts
```

### Funcionalidad

1. Obtención de los últimos artículos de la semana
2. Generación de contenido del newsletter
3. Envío a través de Resend API
4. Actualización de estadísticas

### Dependencias

- `modules/newsletter/`
- `resend` (SDK)

---

## Scripts de mantenimiento

### delete-duplicates.ts

Elimina artículos duplicados por slug.

```bash
npx tsx scripts/delete-duplicates.ts
```

### delete-external-images.ts

Elimina imágenes externas no almacenadas en Supabase.

```bash
npx tsx scripts/delete-external-images.ts
```

### check-expired-images.ts

Verifica imágenes expiradas.

```bash
npx tsx scripts/check-expired-images.ts
```

### delete-fallbacks.ts

Elimina imágenes de fallback almacenadas.

```bash
npx tsx scripts/delete-fallbacks.ts
```

### test-env.ts

Verifica la configuración del entorno.

```bash
npx tsx scripts/test-env.ts
```

### test-upload.ts

Prueba la carga de imágenes.

```bash
npx tsx scripts/test-upload.ts
```

### diagnose-json-errors.ts

Ayuda a diagnosticar errores en el parseo JSON de las IA.

```bash
npx tsx scripts/diagnose-json-errors.ts
```

### migrate-images.ts

Script para migrar imágenes a Supabase Storage.

```bash
npx tsx scripts/migrate-images.ts
```

### ensure-bucket.ts

Asegura que el bucket de almacenamiento exista y esté configurado.

```bash
npx tsx scripts/ensure-bucket.ts
```

---

## Referencias

- [[04 - Flujos de Trabajo]]
- [[05 - Configuración]]