"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addSubscriber(formData: FormData) {
  const email = formData.get("email")?.toString();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Email inválido" };
  }

  try {
    await prisma.subscriber.create({
      data: { email, active: true }
    });
    revalidatePath("/admin/newsletter");
    return { success: true };
  } catch (error) {
    return { success: false, error: "El email ya está suscrito" };
  }
}

export async function toggleSubscriberStatus(id: string, active: boolean) {
  try {
    await prisma.subscriber.update({
      where: { id },
      data: { active }
    });
    revalidatePath("/admin/newsletter");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al actualizar el estado" };
  }
}

export async function deleteSubscriber(id: string) {
  try {
    await prisma.subscriber.delete({ where: { id } });
    revalidatePath("/admin/newsletter");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al eliminar suscriptor" };
  }
}
