# Scripts de EmeDotEme

## 🐚 Scripts de Shell (Raíz)

Estos scripts actúan como orquestadores de alto nivel para facilitar la ejecución de tareas comunes y la gestión del bot automático.

| Script                | Descripción                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| `publicar.sh`         | **Pipeline Principal**: Genera el artículo y lo publica en todas las redes sociales configuradas. |
| `publicarprueba.sh`   | **Modo Test**: Simula la generación de un artículo y muestra previsualizaciones sin afectar a producción. |
| `iniciar-bot.sh`      | Levanta un proceso en segundo plano que publica artículos automáticamente cada 3-5 horas. |
| `detener-bot.sh`      | Detiene el proceso del bot automático de forma segura.                      |
| `enviar_newsletter.sh`| Ejecuta el proceso de envío de la newsletter semanal.                       |
| `pruebaia.sh`         | Script rápido para probar todas las funciones de IA.                        |

---

## 🛠️ Detalles de Scripts de Shell

### publicar.sh
Es el script principal de producción. Carga el entorno, ejecuta el pipeline de Node.js (`publish.ts`) y, si tiene éxito, dispara los scripts de publicación en Python para Binance Square, Telegram y Bluesky.
- **Logs**: Centralizados en `logs/emedoteme.log`.

### iniciar-bot.sh
Ideal para servidores donde se desea una publicación constante sin depender de servicios externos de Cron.
- Genera esperas aleatorias entre ejecuciones para humanizar el ritmo de publicación.
- Crea un archivo `bot.pid` para control de procesos y un log dedicado en `bot.log`.

### publicarprueba.sh
Utiliza la variable de entorno `DRY_RUN=true`. Es la herramienta principal para validar cambios en el formato de los artículos o en la generación de imágenes antes de salir a producción.

---

## 🚀 Scripts de Node.js (TSX)

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