-- Control de calidad del texto (auditoría del borrador contra sus fuentes).
-- Columna nueva y anulable: los artículos anteriores se quedan sin registro.
ALTER TABLE "Article" ADD COLUMN "textQa" TEXT;
