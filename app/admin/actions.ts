"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function togglePublishStatus(id: string, newStatus: boolean) {
  try {
    const article = await prisma.article.findUnique({ where: { id }, select: { publishedAt: true, announcedAt: true } });
    
    await prisma.article.update({
      where: { id },
      data: { 
        published: newStatus,
        // Si se publica por primera vez, guardar la fecha
        publishedAt: newStatus && !article?.publishedAt ? new Date() : undefined,
        // Publicar desde el panel no dispara el anuncio en redes sociales: eso
        // es exclusivo de los borradores aprobados por Telegram. Se marca como
        // anunciado para que el publicador no lo recoja en su próxima vuelta.
        announcedAt: newStatus && !article?.announcedAt ? new Date() : undefined
      }
    });
    
    // Invalidar cachés para que la web principal muestre los cambios
    revalidatePath('/');
    revalidatePath('/noticias');
    revalidatePath('/admin');
    
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo actualizar el estado." };
  }
}

export async function deleteArticle(id: string) {
  try {
    await prisma.article.delete({
      where: { id }
    });
    
    // Invalidar cachés
    revalidatePath('/');
    revalidatePath('/noticias');
    revalidatePath('/admin');
    
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo borrar el artículo." };
  }
}

export async function updateArticle(id: string, data: {
  title: string;
  slug: string;
  summary: string;
  content: string;
  keyPoints?: string[];
  keyPointsEn?: string[];
  impactLevel?: string;
  complexity?: string;
  tickers?: string[];
  glossary?: any;
  glossaryEn?: any;
  faqs?: any;
  faqsEn?: any;
  imageUrl: string;
  imageCaption: string;
  tags?: string[];
  isPinned?: boolean;
  priority?: number;
}) {
  try {
    const tagsArray = data.tags || [];
    const updated = await prisma.article.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        keyPoints: data.keyPoints || [],
        keyPointsEn: data.keyPointsEn || [],
        impactLevel: data.impactLevel,
        complexity: data.complexity,
        tickers: data.tickers || [],
        glossary: data.glossary || [],
        glossaryEn: data.glossaryEn || [],
        faqs: data.faqs || [],
        faqsEn: data.faqsEn || [],
        content: data.content,
        imageUrl: data.imageUrl,
        imageCaption: data.imageCaption,
        isPinned: data.isPinned,
        priority: data.priority,
        articleTags: {
          set: [], // Limpiar relaciones actuales
          connectOrCreate: tagsArray.map(tag => ({
            where: { name: tag },
            create: { 
              name: tag, 
              slug: tag.toLowerCase().replace(/\s+/g, '-') 
            }
          }))
        }
      }
    });

    revalidatePath('/');
    revalidatePath('/noticias');
    revalidatePath('/admin');
    revalidatePath(`/articulo/${updated.slug}`);

    return { success: true, article: updated };
  } catch {
    return { success: false, error: "Error al guardar los cambios del artículo." };
  }
}

export async function createArticle(data: {
  title: string;
  slug: string;
  summary: string;
  content: string;
  keyPoints?: string[];
  keyPointsEn?: string[];
  impactLevel?: string;
  complexity?: string;
  tickers?: string[];
  glossary?: any;
  glossaryEn?: any;
  faqs?: any;
  faqsEn?: any;
  imageUrl: string;
  imageCaption: string;
  tags?: string[];
  categoryId: string;
  published: boolean;
  isPinned?: boolean;
  priority?: number;
}) {
  try {
    const tagsArray = data.tags || [];
    const newArticle = await prisma.article.create({
      data: {
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        keyPoints: data.keyPoints || [],
        keyPointsEn: data.keyPointsEn || [],
        impactLevel: data.impactLevel,
        complexity: data.complexity,
        tickers: data.tickers || [],
        glossary: data.glossary || [],
        glossaryEn: data.glossaryEn || [],
        faqs: data.faqs || [],
        faqsEn: data.faqsEn || [],
        content: data.content,
        imageUrl: data.imageUrl,
        imageCaption: data.imageCaption,
        isPinned: data.isPinned || false,
        priority: data.priority || 0,
        publishedAt: data.published ? new Date() : null,
        // El artículo del panel no pasa por el flujo de aprobación de Telegram,
        // así que se marca como ya anunciado: el publicador solo anuncia los
        // borradores aprobados desde Telegram, no lo que se crea a mano aquí.
        announcedAt: data.published ? new Date() : null,
        articleTags: {
          connectOrCreate: tagsArray.map(tag => ({
            where: { name: tag },
            create: { 
              name: tag, 
              slug: tag.toLowerCase().replace(/\s+/g, '-') 
            }
          }))
        },
        categoryId: data.categoryId,
        published: data.published,
        author: 'Carlos "Emérito" López Lovera' // Autor humano por defecto para los artículos manuales
      }
    });

    revalidatePath('/');
    revalidatePath('/noticias');
    revalidatePath('/admin');
    revalidatePath(`/articulo/${newArticle.slug}`);

    return { success: true, article: newArticle };
  } catch {
    return { success: false, error: "Error al publicar la noticia. Asegúrate de que el Slug sea único." };
  }
}
