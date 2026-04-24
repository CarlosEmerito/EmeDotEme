"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  slug: z.string().min(1, "El slug es obligatorio").regex(/^[a-z0-9-]+$/, "Slug inválido"),
});

export async function createCategory(formData: FormData) {
  const result = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  try {
    await prisma.category.create({
      data: result.data,
    });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Create category error:", error);
    return { success: false, error: "El slug o el nombre ya existen." };
  }
}

export async function updateCategory(id: string, formData: FormData) {
  const result = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  try {
    await prisma.category.update({
      where: { id },
      data: result.data,
    });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Update category error:", error);
    return { success: false, error: "El slug o el nombre ya existen." };
  }
}

export async function deleteCategory(id: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { articles: true }
    });

    if (category?.articles.length) {
      return { success: false, error: "No puedes eliminar una categoría con artículos." };
    }

    await prisma.category.delete({
      where: { id },
    });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Delete category error:", error);
    return { success: false, error: "Error al eliminar la categoría." };
  }
}

export async function renameTag(oldTagName: string, newTagName: string) {
  if (!newTagName || oldTagName === newTagName) return { success: false, error: "Nombre inválido o igual al anterior" };

  try {
    const tag = await prisma.tag.findUnique({
      where: { name: oldTagName }
    });

    if (!tag) return { success: false, error: "La etiqueta no existe" };

    await prisma.tag.update({
      where: { id: tag.id },
      data: { 
        name: newTagName,
        slug: newTagName.toLowerCase().replace(/\s+/g, '-')
      }
    });

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Rename tag error:", error);
    return { success: false, error: "Error al actualizar la etiqueta" };
  }
}

export async function deleteTag(tagName: string) {
  try {
    const tag = await prisma.tag.findUnique({
      where: { name: tagName }
    });

    if (!tag) return { success: false, error: "La etiqueta no existe" };

    await prisma.tag.delete({
      where: { id: tag.id }
    });

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Delete tag error:", error);
    return { success: false, error: "Error al eliminar la etiqueta" };
  }
}
