"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateSobreMiContent(content: string) {
  try {
    await prisma.setting.upsert({
      where: { key: "sobre_mi_content" },
      update: { value: content },
      create: { 
        id: "sobre_mi_content",
        key: "sobre_mi_content", 
        value: content 
      }
    });
    
    revalidatePath("/admin/sobre-mi");
    revalidatePath("/sobre-mi");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al guardar el contenido." };
  }
}
