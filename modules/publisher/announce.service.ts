import { PrismaClient } from "@prisma/client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from "fs";
import path from "path";
import { REVIEW_STATUS } from "../../lib/review-token";

/**
 * Anuncio en redes sociales de un artículo ya aprobado.
 *
 * El pipeline genera borradores y NO publica: la publicación en Binance Square,
 * Telegram y Bluesky se hace después, cuando Emérito ha pulsado «Sí» en el
 * mensaje de aprobación. Cada ejecución del publicador empieza por aquí: si hay
 * algún artículo aprobado al que todavía no se le ha anunciado, deja preparado
 * `tmp/latest_article.json` (que es lo que leen los scripts de Python).
 *
 * `announcedAt` se marca al dejar el fichero, no después: si una red falla, el
 * anuncio no se repite (publicar dos veces es peor que publicar a medias), y el
 * fallo queda en los logs y en el aviso de error de Telegram.
 */
export async function announceNextApprovedArticle(prisma: PrismaClient) {
  const article = await prisma.article.findFirst({
    where: {
      published: true,
      reviewStatus: REVIEW_STATUS.approved,
      announcedAt: null,
    },
    orderBy: { reviewedAt: "asc" },
    include: { articleTags: true, category: true },
  });

  if (!article) return null;

  const tmpDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

  const articleData = {
    id: article.id,
    title: article.title,
    link: `https://www.emedoteme.es/articulo/${article.slug}`,
    description: article.content || article.summary,
    imageUrl: article.imageUrl,
    tags: article.articleTags ? article.articleTags.map((t: any) => t.name) : [],
  };

  fs.writeFileSync(
    path.join(tmpDir, "latest_article.json"),
    JSON.stringify(articleData, null, 2)
  );

  await prisma.article.update({
    where: { id: article.id },
    data: { announcedAt: new Date() },
  });

  return article;
}
