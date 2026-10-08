# 12 - Aprobación editorial por Telegram

> [!NOTE]
> Desde esta versión, **el pipeline no publica nada por su cuenta**: genera el artículo como borrador privado, avisa por Telegram y espera una decisión humana. Este documento explica el flujo, los estados y qué hay que configurar.

## Qué cambia respecto al flujo anterior

| Antes | Ahora |
|---|---|
| `publishDailyArticle()` guardaba el artículo publicado y escribía `tmp/latest_article.json` | Guarda el artículo **no publicado** (`published = false`, `reviewStatus = 'pending'`) con un `reviewToken` y manda la petición de aprobación a Telegram |
| `publicar.sh` generaba y publicaba en las tres redes en el mismo paso | `publicar.sh` anuncia primero lo aprobado pendiente y después genera el borrador del día |
| Nadie leía antes de publicar | Emérito abre el borrador, decide y pulsa |

## El mensaje de Telegram

Un solo mensaje por borrador, con la imagen, el título, el resumen, el **enlace privado** y tres botones:

| Botón | `callback_data` | Qué hace |
|---|---|---|
| ✅ Sí | `apr.y.<token>` | `published = true`, `publishedAt = ahora`, `reviewStatus = 'approved'` y revalida las páginas. El anuncio en redes sale en la siguiente ejecución |
| ❌ No | `apr.n.<token>` | `reviewStatus = 'rejected'`, sigue sin publicarse |
| 🤖 EmeDotHermes | `apr.h.<token>` | `reviewStatus = 'hermes_review'`: se pide un diagnóstico antes de decidir |

## Estados de un artículo

| `reviewStatus` | Significado | ¿Web? |
|---|---|---|
| `pending` | Borrador esperando decisión | No |
| `approved` | Aprobado (o anterior al flujo) | Sí |
| `rejected` | Descartado | No |
| `hermes_review` | Diagnóstico pedido a EmeDotHermes | No |

`announcedAt` = cuándo salió en Binance Square, Telegram y Bluesky. Un aprobado con `announcedAt = NULL` es lo que anuncia la siguiente ejecución del publicador. Los artículos anteriores al flujo se rellenaron con su fecha de publicación en la migración `20261008200000_backfill_announced_at` para que no se reanuncien.

## El enlace privado

`/preview/<token>`. El token son 32 caracteres hexadecimales aleatorios (`crypto.getRandomValues`) que solo existen en la base de datos y en el mensaje de Telegram. La página no se indexa (`noindex`, fuera de `robots.txt` y del sitemap) y no lleva anuncios ni comentarios.

Además, un artículo no publicado **ya no se sirve por su URL pública**: `/articulo/<slug>` devuelve «no encontrado» salvo que haya sesión de admin. Antes un borrador era legible por cualquiera que supiera su slug.

## El webhook

`POST /api/telegram/webhook`. Orden de comprobaciones:

1. Si `TELEGRAM_WEBHOOK_SECRET` está definido, la cabecera `X-Telegram-Bot-Api-Secret-Token` tiene que coincidir.
2. Quien pulsa tiene que ser el chat de `TELEGRAM_CHAT_ID` (el dueño), no cualquiera.
3. El `callback_data` tiene que tener la forma `apr.<y|n|h>.<32 hex>`.
4. El token tiene que existir en la base de datos.

La lógica de la decisión vive en `modules/articles/review.service.ts`, separada del HTTP, y se prueba en `tests/review-decision.test.ts`.

## Configuración

| Dónde | Variables | Para qué |
|---|---|---|
| GitHub Actions (secretos) | las de siempre | generar el borrador y firmar el enlace |
| **Vercel** | `TELEGRAM_TOKEN`, `TELEGRAM_CHAT_ID` | el webhook y la página de revisión viven en la web |
| Vercel (opcional) | `TELEGRAM_WEBHOOK_SECRET`, `SITE_URL` | secret_token del webhook y base del enlace privado |

El webhook se registra una sola vez:

```bash
curl -s "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://www.emedoteme.es/api/telegram/webhook"
```

`prisma migrate deploy` en el workflow aplica las migraciones nuevas, así que en CI no hay nada que hacer a mano. En producción, conviene aplicar la migración **antes** de desplegar el código (las columnas nuevas las consulta Prisma desde el primer momento).

## Ver también

- [[04 - Flujos de Trabajo]] — el pipeline completo
- [[06 - Scripts]] — `announce_approved.ts` y `publicar.sh`
- [[11 - Cumplimiento Legal]] — por qué la revisión humana previa importa
