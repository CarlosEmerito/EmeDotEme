# Scripts de EmeDotEme

## 🐚 Scripts de Shell (Raíz)

Estos scripts actúan como orquestadores de alto nivel para facilitar la ejecución de tareas comunes y la automatización del bot.

| Script                | Descripción                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| `publicar.sh`         | **Pipeline Principal**: Genera el artículo y lo publica en todas las redes sociales configuradas. |
| `publicaria.sh`       | **Pipeline IA**: Orquesta el pipeline exclusivamente para temas de Inteligencia Artificial. |
| `publicarprueba.sh`   | **Modo Test**: Simula la generación de un artículo y muestra previsualizaciones sin afectar a producción. |
| `enviar_newsletter.sh`| Ejecuta el proceso de envío de la newsletter semanal.                       |

---

## 🛠️ Detalles de Scripts de Shell y Automatización

### publicar.sh
Es el script principal de producción. Carga el entorno, ejecuta el pipeline de Node.js (`publish.ts`) y, si tiene éxito, dispara los scripts de publicación en Python para Binance Square, Telegram y Bluesky.
- **Logs**: Centralizados en `logs/emedoteme.log`.

### publicaria.sh
Orquesta la publicación diaria especializada en Inteligencia Artificial llamando a `scripts/publish-ia.ts` y publicando el JSON resultante en las redes sociales.

### publicarprueba.sh
Utiliza la variable de entorno `DRY_RUN=true`. Es la herramienta principal para validar cambios en el formato de los artículos o en la generación de imágenes en modo de prueba (sin persistencia en base de datos ni publicaciones en producción).

---

## 🚀 Automatización en GitHub Actions

La generación y publicación automática de noticias está automatizada mediante **GitHub Actions**. El flujo está definido en el archivo [generate-news.yml](file:///home/emerito/EmeDotEme/.github/workflows/generate-news.yml) y corre de forma "serverless" (sin servidores residentes):

1. **Cron Job**: Ejecuta automáticamente el pipeline cada 4 horas (`0 */4 * * *`).
2. **Ejecución Manual**: Permite disparar la generación en cualquier momento desde la pestaña "Actions" de GitHub usando `workflow_dispatch`.
3. **Configuración**: El workflow lee los secretos configurados en el repositorio de GitHub y reconstruye el archivo `.env` dinámicamente en el entorno de ejecución temporal.

---

## 🚀 Scripts de Node.js (TSX)

---

## Scripts de Diagnóstico

### check-latest-article.ts
Muestra el último artículo generado con todos sus campos (útil para verificar slugs y traducciones).

```bash
npx tsx scripts/check-latest-article.ts
```

### test-env.ts
Verifica la configuración del entorno.

```bash
npx tsx scripts/test-env.ts
```

---

## Scripts de Publicación en Redes Sociales (Python)

Ubicados en `scripts/python/`, estos scripts publican el contenido generado en diversas plataformas. Se integran con el pipeline de Node.js a través de scripts de shell.

| Script                | Descripción                        |
|-----------------------|------------------------------------|
| `publish_telegram.py` | Publica en el canal de Telegram    |
| `publish_bluesky.py` | Publica en Bluesky                 |
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

## publish-ia.ts

**Ubicación**: `scripts/publish-ia.ts`

### Descripción

Pipeline de publicación especializado en temas de Inteligencia Artificial.

### Uso

```bash
npx tsx scripts/publish-ia.ts
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

### test-upload.ts

Prueba la carga de imágenes a Supabase Storage.

```bash
npx tsx scripts/test-upload.ts
```

### ensure-bucket.ts

Asegura que el bucket de almacenamiento exista y esté configurado.

```bash
npx tsx scripts/ensure-bucket.ts
```

### add_sub.ts

Añade un suscriptor manualmente al newsletter.

```bash
npx tsx scripts/add_sub.ts
```

---

## Referencias

- [[04 - Flujos de Trabajo]]
- [[05 - Configuración]]