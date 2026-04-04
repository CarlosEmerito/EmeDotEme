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

export async function renameTag(oldTag: string, newTag: string) {
  if (!newTag || oldTag === newTag) return { success: false, error: "Nombre inválido o igual al anterior" };

  try {
    const articles = await prisma.article.findMany({
      where: { tags: { has: oldTag } }
    });

    for (const article of articles) {
      const updatedTags = article.tags.map(t => t === oldTag ? newTag : t);
      await prisma.article.update({
        where: { id: article.id },
        data: { tags: Array.from(new Set(updatedTags)) }
      });
    }

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Rename tag error:", error);
    return { success: false, error: "Error al actualizar la etiqueta" };
  }
}

export async function deleteTag(tag: string) {
  try {
    const articles = await prisma.article.findMany({
      where: { tags: { has: tag } }
    });

    for (const article of articles) {
      const updatedTags = article.tags.filter(t => t !== tag);
      await prisma.article.update({
        where: { id: article.id },
        data: { tags: updatedTags }
      });
    }

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Delete tag error:", error);
    return { success: false, error: "Error al eliminar la etiqueta" };
  }
}
