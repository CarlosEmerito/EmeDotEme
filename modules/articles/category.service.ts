import { prisma } from "@/lib/prisma";

export async function getCategoryBySlug(slug: string) {
  return await prisma.category.findUnique({
    where: { slug }
  });
}
