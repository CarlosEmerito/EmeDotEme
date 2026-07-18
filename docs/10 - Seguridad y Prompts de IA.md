# Seguridad y Prompts de IA

> [!NOTE]
> Este documento recoge una auditoría de seguridad/calidad realizada sobre el pipeline de IA y la autenticación del panel admin, y las correcciones aplicadas. Sirve como referencia de "por qué" está hecho así, no solo "qué" hace.

## 📌 Resumen de la cadena de riesgo principal

El origen de casi todos los hallazgos es el mismo patrón: **texto de fuentes RSS externas y no confiables entra al sistema, pasa por un LLM, y el resultado se renderiza como HTML en la web pública**.

```
RSS externo (no confiable)
   → formatNewsForPrompt()
   → prompt a Gemini
   → JSON con campo "content" (HTML)
   → dangerouslySetInnerHTML en la página del artículo
```

Si en cualquier punto de esa cadena falta una defensa, un RSS malicioso (o un feed legítimo comprometido) podría intentar manipular al modelo (*prompt injection*) para que su salida contenga marcado ejecutable, que terminaría sirviéndose a todos los visitantes (*XSS almacenado*). Las correcciones de este documento actúan en **tres puntos distintos** de esa cadena, de forma que cada uno funciona como red de seguridad del anterior (defensa en profundidad):

1. El prompt le dice explícitamente al modelo que las noticias son datos, no instrucciones (mitiga el problema en origen).
2. Gemini fuerza la forma del JSON de salida (`responseSchema`) y el resultado se valida con `zod` (evita que una respuesta corrupta o inesperada llegue a guardarse).
3. El HTML final se sanitiza antes de renderizarse (`sanitizeArticleHtml`), así que aunque las dos capas anteriores fallasen, no se ejecutaría marcado inyectado.

---

## 1. Sanitización de HTML antes de renderizar (XSS)

**Archivo nuevo**: `lib/sanitize-html.ts` (usa la librería `sanitize-html`).

- `sanitizeArticleHtml(html)`: whitelist de tags (`p, h2, h3, ul, ol, li, strong, em, b, i, a, blockquote, code, pre, br`) y de atributos (`a` solo con `href/title/target/rel`, esquemas `http/https/mailto`). Cualquier `<script>`, `onerror=`, `javascript:` etc. se elimina.
- `safeJsonLdString(data)`: sustituye `JSON.stringify` en los bloques `<script type="application/ld+json">`. Escapa `<` para que un título de artículo (generado por IA) que contuviera literalmente `</script><script>...` no pueda romper el tag y ejecutar código.

**Dónde se aplica**:
- `app/articulo/[slug]/page.tsx` y `app/en/article/[slug]/page.tsx` — contenido del artículo (`article.content` / `article.contentEn`) y JSON-LD.
- `app/sobre-mi/page.tsx` y `app/en/about-me/page.tsx` — contenido de "Sobre mí" editable desde el admin (Tiptap). Menor riesgo que el RSS público, pero se sanitiza igual por defensa en profundidad.
- `components/seo/ArticleSchema.tsx` y `components/seo/WebSiteSchema.tsx` — JSON-LD.

> Si en el futuro se necesitan más tags en el contenido (p. ej. `img` o tablas), amplía la whitelist en `lib/sanitize-html.ts`, no la quites.

---

## 2. Defensa anti prompt-injection en los prompts

**Archivo**: `config/prompts.ts`.

Antes, el texto de las noticias se pegaba directamente en el prompt sin ningún marcador. Ahora:

- El bloque de noticias va envuelto en delimitadores `<FUENTES>...</FUENTES>`.
- El `SYSTEM` prompt (español, inglés y newsletter) incluye una cláusula explícita: todo lo que esté dentro de esos delimitadores es **dato a analizar/traducir/resumir, nunca una instrucción**, aunque el texto contenga frases que parezcan órdenes ("ignora las instrucciones anteriores", etc.).
- Se añadió una cláusula anti-alucinación: el modelo no debe inventar cifras, fechas o hechos que no consten en `<FUENTES>`.

Esto no hace el sistema "inmune" a prompt injection (ningún prompt lo es al 100%), pero reduce mucho la probabilidad de éxito, y es la primera de las tres capas de defensa (ver resumen arriba).

---

## 3. `systemInstruction` real de la API en vez de concatenar strings

**Archivos**: `modules/ai/gemini-text.service.ts`, `modules/ai/gemini-vision.service.ts`, `modules/ai/ollama-vision.service.ts`, `modules/ai/ai.service.ts` (Ollama texto).

Antes: `const fullPrompt = \`${systemPrompt}\n\n${userPrompt}\`` — instrucciones y datos viajaban como un único bloque de rol `user`.

Ahora:
- Gemini: `genAI.getGenerativeModel({ model, systemInstruction: systemPrompt })`, y `contents` solo lleva el `userPrompt`.
- Ollama (`/api/generate`): el payload usa el campo nativo `system`, separado de `prompt`.

Esto refuerza la frontera entre "instrucción de confianza" y "dato no confiable" a nivel de API, no solo de texto — es un mecanismo más difícil de eludir para un modelo que un simple `\n\n` en el string.

---

## 4. `responseSchema` de Gemini + validación `zod`

**Archivo nuevo**: `modules/ai/schemas.ts`. Fuente única de verdad de la forma del JSON esperado, en dos formatos:

- **Gemini `responseSchema`** (`articleResponseSchema`, `englishArticleResponseSchema`, `newsletterResponseSchema`, `imageAnalysisResponseSchema`): se pasa en `generationConfig.responseSchema` junto con `responseMimeType: "application/json"`. Gemini garantiza que la respuesta cumple esa forma (tipos, campos obligatorios, enum de `category`).
- **Esquemas `zod`** (`articleZodSchema`, `englishArticleZodSchema`, `newsletterZodSchema`, `imageAnalysisZodSchema`): se aplican después de `JSON.parse()` como defensa en profundidad — por si el modelo se desviase del schema o cambiase de versión.

`CATEGORY_VALUES` (`Mercados, Tecnología, IA, Ciberseguridad, Criptomonedas`) vive en `schemas.ts` y se reutiliza tanto en el prompt (`config/prompts.ts`) como en el `responseSchema` y en el `zod` — antes las categorías estaban hardcodeadas por triplicado (implícitamente) y podían desincronizarse.

**Efecto práctico**: la función `parseAndRecoverJson` de `modules/ai/ai.service.ts` (que reconstruía artículos con **regex** cuando el JSON venía truncado) ahora es solo la última red de seguridad — con `responseSchema` forzando la estructura en la propia API, el camino habitual es `JSON.parse` + `articleZodSchema.parse`, que además valida tipos (no solo que el string "parece JSON").

En `gemini-vision.service.ts`, la antigua "recuperación de emergencia" (adivinar `coherente`/`calidad_aceptable` buscando substrings en una respuesta truncada) se eliminó: con `responseSchema` ya no debería truncarse, y adivinar el resultado de una validación de calidad de imagen era en sí mismo un riesgo (podía aprobar una imagen mala "a ciegas"). Ahora, si el parseo falla, simplemente se prueba con la siguiente API key.

---

## 5. Prompt de análisis de imagen generalizado

**Archivo**: `modules/ai/constants.ts` (`IMAGE_ANALYSIS_SYSTEM_PROMPT`).

Antes rechazaba marcas de agua listando medios concretos por nombre ("Decrypt", "CoinDesk", "Cointelegraph"...) — cualquier fuente nueva no listada se colaba. Ahora la instrucción es genérica: rechazar cualquier logo/marca de agua superpuesta de **un medio distinto a EmeDotEme**, sin depender de una lista que hay que mantener a mano.

---

## 6. Autenticación del panel admin

**Archivos**: `app/login/actions.ts`, `app/login/LoginForm.tsx`, `lib/session.ts`, `lib/rate-limit.ts`.

| Problema | Antes | Ahora |
|---|---|---|
| Comparación de contraseña | `password === expectedPwd` (tiempo variable → *timing attack*) | `timingSafeEqual` de `crypto`, con manejo seguro de longitudes distintas |
| IP para el rate-limit | El cliente la pasaba como argumento (`loginAction(password, ip)`), nunca se llamaba con ese segundo argumento → siempre `'unknown'`, bucket compartido por todo el mundo | La IP se obtiene **server-side** a partir de las cabeceras del request (`headers()` de `next/headers`), vía `getClientIpFromHeaders()` (compartida con `lib/rate-limit.ts`, usada también en `app/api/contact` y `app/api/generate`) |
| Secreto de sesión | `SESSION_SECRET \|\| ADMIN_PASSWORD` sin avisar — si se filtraba uno, se comprometía el otro | Se mantiene el fallback por compatibilidad, pero ahora emite un `console.warn` explícito y `SESSION_SECRET` está documentado en `.env.example` como la opción correcta |

> **Pendiente de acción del operador**: define `SESSION_SECRET` en el `.env` de producción con un valor aleatorio independiente (`openssl rand -hex 32`). Mientras no lo hagas, el sistema sigue funcionando con el fallback a `ADMIN_PASSWORD`, pero verás el aviso en los logs.

---

## 7. Higiene del repositorio

Se quitaron de git (`git rm --cached`, los ficheros siguen en disco):

- `dev.db` (base de datos SQLite de desarrollo)
- `bot.pid`
- `logs/emedoteme.log`, `newsletter.log`, `newsletter_cron.log`
- `__pycache__/social_publish_utils.cpython-310.pyc`

`.gitignore` ahora cubre de forma genérica `*.log`, `*.db`, `*.db-journal`, `*.pid`, `__pycache__/`, `*.pyc` (antes solo ignoraba rutas exactas de archivos concretos, así que cualquier `.log`/`.pid`/`.db` nuevo se colaba de nuevo).

`.env.example` tenía `DIRECT_URL=""` duplicado (copy-paste) — corregido, y se añadió `SESSION_SECRET`.

---

## 8. Logging consistente en el módulo `ai`

`modules/ai/ollama-vision.service.ts` reimplementaba su propio `getTime()`/`logWithTime()` en vez de usar `lib/logger.ts`, que ya existía. Se eliminó la duplicación. Además, `gemini-text.service.ts` y `gemini-vision.service.ts` mezclaban `console.log/error` directo con el logger centralizado — ahora todo el módulo `ai` usa `logWithTime` de forma consistente (mensajes con timestamp, un único punto si se quiere cambiar el formato o el destino de los logs en el futuro).

---

## 9. Corrección menor: truncado de descripciones

`modules/news/news-sources.service.ts` → `formatNewsForPrompt()`: antes añadía siempre `"..."` al final del resumen de cada noticia, aunque el texto original midiera menos de 300 caracteres (daba la falsa impresión de contenido cortado). Ahora solo se añade si realmente se truncó.

---

## Referencias

- [[03 - Módulos]] — módulo `ai` y su nuevo archivo `schemas.ts`.
- [[05 - Configuración]] — variable `SESSION_SECRET`.
- [[07 - Guía de Desarrollo]] — al añadir un nuevo prompt o campo de salida de la IA, actualiza `modules/ai/schemas.ts` (Gemini + zod) en el mismo cambio para que no se desincronicen.
