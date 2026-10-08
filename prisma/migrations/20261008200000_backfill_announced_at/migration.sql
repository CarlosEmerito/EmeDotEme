-- Relleno de `announcedAt` para los artículos que ya estaban publicados.
--
-- Sin esto, los artículos anteriores al flujo de aprobación quedan con
-- `announcedAt = NULL`, y `scripts/announce_approved.ts` los interpretaría como
-- «aprobados pendientes de anunciar»: la primera ejecución del publicador
-- volvería a mandar a Binance Square, Telegram y Bluesky un artículo antiguo.
--
-- Se marca como anunciado en su fecha de publicación (o de creación, si no
-- tiene): da igual la fecha exacta, lo que importa es que no sea NULL.
UPDATE "Article"
SET "announcedAt" = COALESCE("publishedAt", "createdAt")
WHERE "published" = true AND "announcedAt" IS NULL;
