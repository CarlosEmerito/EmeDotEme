# Scripts de EmeDotEme

## Scripts de Shell (Raíz)

Estos scripts orquestan las tareas de alto nivel.

| Script                | Descripción                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| `publicar.sh`         | **Pipeline programado**. Anuncia en redes el artículo aprobado pendiente (si lo hay) y después genera el borrador del día. |
| `publicaria.sh`       | Genera un borrador filtrando solo fuentes de IA (`scripts/publish-ia.ts`). No forma parte del flujo programado. |
| `publicarprueba.sh`   | **Modo prueba** (`DRY_RUN=true`): genera un artículo sin persistir en base de datos y muestra qué se publicaría. |
| `enviar_newsletter.sh`| Ejecuta el envío de la newsletter semanal.                                  |

---

## Detalles de Scripts de Shell

### publicar.sh
Es el script que ejecuta el workflow programado. Hace dos tareas independientes, en este orden:

1. **Anunciar lo aprobado pendiente**: borra `tmp/latest_article.json`, llama a `npx tsx scripts/announce_approved.ts` y, si el script ha dejado el fichero, publica en Binance Square (`publish_direct.py`), Telegram (`publish_telegram.py`) y Bluesky (`publish_bluesky.py`). Si no hay ningún aprobado sin anunciar, se salta este paso.
2. **Generar el borrador del día**: ejecuta `npx tsx scripts/publish.ts`. El artículo queda como borrador y la petición de aprobación se envía a Telegram.

- **Logs**: centralizados en `logs/emedoteme.log`.

### publicaria.sh
Llama primero a `npx tsx scripts/announce_approved.ts` (anuncia en redes lo que ya esté aprobado y pendiente) y después a `npx tsx scripts/publish-ia.ts`, que genera un borrador filtrando por las fuentes de IA y pide la aprobación por Telegram. No está enganchado al workflow programado.

### publicarprueba.sh
Exporta `DRY_RUN=true`. Ejecuta `scripts/publish_test.ts` (sin persistencia) y muestra las previsualizaciones de Binance Square, Telegram y Bluesky usando `tmp/test_article.json`. Es la herramienta para validar cambios de formato o de generación sin tocar producción.

---

## Automatización en GitHub Actions

La generación programada está automatizada en [generate-news.yml](.github/workflows/generate-news.yml):

1. **Cron**: ejecuta `./publicar.sh` cada 4 horas (`0 */4 * * *`).
2. **Ejecución manual**: `workflow_dispatch` desde la pestaña Actions.
3. **Configuración**: el workflow inyecta los secretos del repositorio como variables de entorno. Ver [[05 - Configuración]] para la lista y para el problema conocido de los secretos de imagen.

---

## Scripts de Node.js (TSX)

### announce_approved.ts

**Ubicación**: `scripts/announce_approved.ts`

Saca el siguiente artículo aprobado pendiente de anunciar y escribe `tmp/latest_article.json` (que leen los scripts de Python). Si no hay ninguno, no escribe nada. Lo llama `publicar.sh`.

```bash
npx tsx scripts/announce_approved.ts
```

### publish.ts

**Ubicación**: `scripts/publish.ts`

Wrapper del `PublisherService`. Genera un artículo a partir de las fuentes RSS, lo guarda como **borrador** y pide la aprobación por Telegram.

```bash
npx tsx scripts/publish.ts
```

### publish_test.ts

**Ubicación**: `scripts/publish_test.ts`

Generación completa sin persistencia en base de datos. Escribe el resultado en `tmp/test_article.json` para inspección.

```bash
npx tsx scripts/publish_test.ts
```

### publish-ia.ts

**Ubicación**: `scripts/publish-ia.ts`

Igual que `publish.ts` pero filtrando solo las fuentes de IA (`mit-ai`, `venturebeat-ai`, `ai-news`, `marktechpost`).

```bash
npx tsx scripts/publish-ia.ts
```

### force-generate.ts

**Ubicación**: `scripts/force-generate.ts`

Genera y guarda un artículo directamente (sin pasar por el flujo de borrador), omitiendo las verificaciones de duplicados. Script de mantenimiento.

```bash
npx tsx scripts/force-generate.ts
```

### send_newsletter.ts

**Ubicación**: `scripts/send_newsletter.ts`

Genera y envía la newsletter semanal a los suscriptores activos.

1. Obtiene los artículos publicados en los últimos 7 días.
2. Genera el contenido del boletín (Gemini).
3. Envía por Resend, con enlace de baja firmado por suscriptor.

```bash
npx tsx scripts/send_newsletter.ts
```

---

## Scripts de Diagnóstico

### check-latest-article.ts
Muestra el último artículo generado (título, slug, longitud y extracto del contenido).

```bash
npx tsx scripts/check-latest-article.ts
```

### test-env.ts
Comprueba las credenciales de Supabase y la presencia de `DATABASE_URL`.

```bash
npx tsx scripts/test-env.ts
```

---

## Scripts de mantenimiento

### test-upload.ts
Prueba la subida de una imagen a Supabase Storage.

```bash
npx tsx scripts/test-upload.ts
```

### ensure-bucket.ts
Asegura que el bucket de almacenamiento exista y esté configurado.

```bash
npx tsx scripts/ensure-bucket.ts
```

### add_sub.ts
Añade un suscriptor de prueba al newsletter.

```bash
npx tsx scripts/add_sub.ts
```

---

## Scripts de Publicación en Redes Sociales (Python)

Ubicados en `scripts/python/`, publican el contenido de `tmp/latest_article.json` en las plataformas. Los invoca `publicar.sh`.

| Script                | Descripción                        |
|-----------------------|------------------------------------|
| `publish_direct.py`   | Publica en Binance Square          |
| `publish_telegram.py` | Publica en el canal de Telegram    |
| `publish_bluesky.py`  | Publica en Bluesky                 |
| `send_private_test.py`| Envía una prueba al Telegram privado |

---

## Referencias

- [[04 - Flujos de Trabajo]]
- [[05 - Configuración]]
- [[12 - Aprobación Editorial]]
