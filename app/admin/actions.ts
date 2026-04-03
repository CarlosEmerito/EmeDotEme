"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function togglePublishStatus(id: string, newStatus: boolean) {
  try {
    await prisma.article.update({
      where: { id },
      data: { published: newStatus }
    });
    
    // Invalidar cachés para que la web principal muestre los cambios
    revalidatePath('/');
    revalidatePath('/noticias');
    revalidatePath('/admin');
    
    return { success: true };
  } catch (error) {
    console.error("Error cambiando estado:", error);
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
  } catch (error) {
    console.error("Error borrando artículo:", error);
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
}) {
  try {
    const updated = await prisma.article.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        content: data.content,
        imageUrl: data.imageUrl,
        imageCaption: data.imageCaption,
        tags: data.tags,
      }
    });

    revalidatePath('/');
    revalidatePath('/noticias');
    revalidatePath('/admin');
    revalidatePath(`/articulo/${updated.slug}`);

    return { success: true, article: updated };
  } catch (error) {
    console.error("Error actualizando artículo:", error);
    return { success: false, error: "Error al guardar los cambios del artículo." };
  }
}
