# 11 - Cumplimiento Legal

Este documento recoge las obligaciones legales que condicionan el diseño del
publicador y **qué parte del código las implementa**. No es asesoramiento
jurídico: es la traza entre cada obligación y el punto del repositorio donde se
cumple, para que nadie tenga que deducirlo leyendo el código.

> [!IMPORTANT]
> Si vas a tocar la cascada de imágenes, el consentimiento de cookies o la
> plantilla de artículo, lee antes la sección correspondiente. Varias decisiones
> que parecen arbitrarias están ahí por una razón legal concreta.

---

## 1. Imágenes de prensa — art. 129 bis.2 TRLPI

**La obligación.** El artículo 129 bis.2 del Texto Refundido de la Ley de
Propiedad Intelectual (introducido por el RDL 24/2021, que transpone la Directiva
(UE) 2019/790) sujeta a autorización del editor la puesta a disposición del
público de «cualquier texto, imagen, obra fotográfica o mera fotografía» de una
publicación de prensa. **La excepción de extractos breves del apartado 2 no
cubre las imágenes.**

**Lo que se hacía antes.** El pipeline tomaba la imagen del `og:image` del
artículo original o del feed RSS, la descargaba y la volvía a alojar en Supabase.
Eso es una puesta a disposición sin autorización, agravada por una reproducción
en almacenamiento propio.

**Lo que se hace ahora.**

| Punto | Dónde |
|---|---|
| La cascada ya no incluye `og:image` ni la imagen del RSS | `modules/images/image.service.ts` |
| `source-image.service.ts` eliminado del repositorio | — |
| No se copia ninguna imagen de fuente no autorizada | `isAllowedToStore()` en `modules/storage/supabase.service.ts` |
| La fuente original se enlaza, no se copia | `SourceAttribution` en `components/articles/AiDisclosure.tsx` |
| Pruebas que fijan el comportamiento | `tests/images.test.ts` |

**Por qué enlazar y no copiar.** El artículo 129 bis.6 excluye expresamente el
hiperenlace del derecho del editor de prensa. Enlazar es gratis, legal y además
mejor para el lector: quien quiera la noticia completa va al medio que la hizo.

**La cascada actual:** Pixabay (licencia comercial) → Cloudflare FLUX
(generada, con pie de foto que lo dice) → reserva del proyecto. Ninguna requiere
autorización de terceros.

---

## 2. Derecho a la propia imagen — LO 1/1982

**La obligación.** El consentimiento para usar la imagen de una persona es
necesario aunque la fotografía sea accesible en internet. La STC 27/2020 es
explícita: la accesibilidad no equivale a autorización. Los menores tienen
protección reforzada.

**Cómo se cumple.** El control de calidad con Gemini Vision rechaza las
candidatas que muestren menores identificables, personas identificables en
contexto negativo o personas de las que no se pueda presumir consentimiento. El
criterio está en el prompt de `modules/ai/constants.ts` y se etiqueta como
`derechos de imagen` en los problemas detectados.

---

## 3. Contenido generado con IA — art. 50 Reglamento (UE) 2024/1689

**La obligación.** Exigible desde el 2 de agosto de 2026. Quien despliega un
sistema de IA que genera texto publicado para informar al público sobre asuntos
de interés público debe **divulgar que el contenido ha sido generado por IA**. La
excepción es que exista revisión humana y una persona responsable identificada.

**Cómo se cumple.**

| Punto | Dónde |
|---|---|
| Aviso visible en cada artículo, en ES y EN | `AiDisclosure` en `components/articles/AiDisclosure.tsx` |
| Metadatos legibles por máquina | `metadata.other` en `app/articulo/[slug]/page.tsx` y `app/en/article/[slug]/page.tsx` |
| Autoría como `Organization`, no como persona física | JSON-LD de ambos artículos |
| Responsable editorial identificado | `app/politica-editorial/page.tsx` |
| El aviso cambia si hubo revisión humana | prop `reviewed` de `AiDisclosure` |

**Por qué la autoría es `Organization`.** El texto lo produce un sistema
automático. Atribuirlo a una persona física sería una atribución falsa y, además,
trasladaría a esa persona una responsabilidad que no le corresponde.

---

## 4. Cookies — art. 22.2 LSSI

**La obligación.** El almacenamiento no esencial requiere consentimiento previo,
informado y tan fácil de retirar como de dar. Un banner donde «aceptar» es un
botón grande y «rechazar» un enlace escondido no cumple. Las cookies exentas son
solo las estrictamente necesarias.

**Lo que se hacía antes.** No había banner. La política declaraba que «al
navegar... estará consintiendo», que es precisamente lo que la norma prohíbe. Y
declaraba Google Analytics, que no está instalado.

**Lo que se hace ahora.**

| Punto | Dónde |
|---|---|
| Banner con «Aceptar todas» y «Solo las necesarias» con la misma prominencia | `CookieConsent` en `components/layout/consent.tsx` |
| Nada de terceros se carga antes de decidir | `AdSenseGate` y `AAdsGate` en `components/layout/ThirdPartyGates.tsx` |
| La decisión se puede cambiar desde el pie | `CookieSettingsLink` en `components/layout/Footer.tsx` |
| Bilingüe (ES/EN) | `usePathname()` en `consent.tsx` |
| La política describe lo que realmente se usa | `app/cookies/page.tsx` y `app/en/cookies/page.tsx` |

**Por qué en `localStorage` y no en una cookie.** Guardar la decisión en una
cookie sería instalar almacenamiento para poder preguntar si se puede instalar
almacenamiento. En `localStorage` no se envía al servidor y no se instala nada
antes de que el usuario decida.

**Cookies exentas que sí se usan:** el tema (`theme`, `localStorage`), la propia
decisión (`eme-cookie-consent-v1`, `localStorage`) y la de sesión del panel de
administración. Vercel Analytics y Speed Insights no instalan cookies.

---

## 5. Protección de datos — RGPD y LOPDGDD

**Cómo se cumple.** `app/politica-privacidad/page.tsx` y su versión inglesa
recogen: responsable identificado, finalidades y bases jurídicas por separado,
plazos de conservación concretos, encargados del tratamiento reales (Vercel,
Supabase, Resend, Cloudflare, Pixabay, Google), transferencias internacionales
con su base, los seis derechos del interesado, retirada del consentimiento, vía
de reclamación ante la AEPD y edad mínima.

**Coherencia obligatoria.** Si se añade un proveedor nuevo al pipeline, hay que
añadirlo a esa lista en el mismo cambio. Una política que no menciona a un
encargado real está incumpliendo.

---

## 6. Información al usuario — art. 10 LSSI

**Cómo se cumple.** `app/aviso-legal/page.tsx` identifica al titular y su
contacto. La versión anterior declaraba ser «titular de todos los derechos...
(imágenes...)», una afirmación falsa que se ha eliminado: ahora distingue lo
propio (código, diseño, textos) de lo ajeno (marcas de terceros, fotografías con
licencia).

---

## 7. Reglas para cambios futuros

1. **Nunca añadas una fuente de imagen de terceros a la cascada.** Si necesitas
   una imagen que no puedes obtener con licencia o generar, la respuesta es
   generar una ilustración y decirlo, no copiar la de otro.
2. **Nunca muevas un script de terceros fuera de su gate.** Si un proveedor
   instala cookies, va detrás del consentimiento, sin excepciones.
3. **Si añades un encargado del tratamiento, actualiza la política de privacidad
   en el mismo pull request.**
4. **El aviso de IA no es opcional ni decorativo.** Va en el artículo, en los
   metadatos y en la política editorial.
5. **Los pies de foto de imágenes generadas deben decirlo.** Un lector tiene
   derecho a saber que lo que ve no es una fotografía.

---

## Referencias

- [[02 - Stack Tecnológico]] — la cascada de imágenes en detalle.
- [[04 - Flujos de Trabajo]] — el diagrama del pipeline de imagen.
- [[09 - Troubleshooting]] — qué hacer cuando ninguna candidata pasa el control.
