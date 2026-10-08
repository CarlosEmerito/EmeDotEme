-- Flujo de aprobación editorial por Telegram.
--
-- `reviewStatus` arranca en 'approved' para no alterar el estado de los
-- artículos ya publicados (272 a fecha de esta migración): son anteriores al
-- gate de aprobación y no deben quedar «pendientes» de nada.
ALTER TABLE "Article" ADD COLUMN "reviewStatus" TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE "Article" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Article" ADD COLUMN "reviewNote" TEXT;
ALTER TABLE "Article" ADD COLUMN "reviewToken" TEXT;
ALTER TABLE "Article" ADD COLUMN "announcedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Article_reviewToken_key" ON "Article"("reviewToken");
CREATE INDEX "Article_reviewStatus_announcedAt_idx" ON "Article"("reviewStatus", "announcedAt");
