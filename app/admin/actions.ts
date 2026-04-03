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
