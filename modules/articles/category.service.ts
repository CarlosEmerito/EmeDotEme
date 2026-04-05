import { prisma } from "@/lib/prisma";

export async function getAllCategories() {
  return await prisma.category.findMany({
    orderBy: { name: "asc" }
  });
}

export async function getCategoryBySlug(slug: string) {
  return await prisma.category.findUnique({
    where: { slug }
  });
}
