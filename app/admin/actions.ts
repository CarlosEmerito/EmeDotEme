"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function togglePublishStatus(id: string, newStatus: boolean) {
  try {
    const article = await prisma.article.findUnique({ where: { id }, select: { publishedAt: true } });
    
    await prisma.article.update({
      where: { id },
      data: { 
        published: newStatus,
        // Si se publica por primera vez, guardar la fecha
        publishedAt: newStatus && !article?.publishedAt ? new Date() : undefined
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
        content: data.content,
        imageUrl: data.imageUrl,
        imageCaption: data.imageCaption,
        isPinned: data.isPinned || false,
        priority: data.priority || 0,
        publishedAt: data.published ? new Date() : null,
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
