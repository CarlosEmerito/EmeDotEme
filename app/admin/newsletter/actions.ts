"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

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
    console.error("Add subscriber error:", error);
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
    console.error("Toggle subscriber status error:", error);
    return { success: false, error: "Error al actualizar el estado" };
  }
}

export async function deleteSubscriber(id: string) {
  try {
    await prisma.subscriber.delete({ where: { id } });
    revalidatePath("/admin/newsletter");
    return { success: true };
  } catch (error) {
    console.error("Delete subscriber error:", error);
    return { success: false, error: "Error al eliminar suscriptor" };
  }
}

export async function sendNewsletterNow() {
  try {
    // Ejecutamos el script de envío
    // npx tsx scripts/send_newsletter.ts
    const { stdout, stderr } = await execPromise("npx tsx scripts/send_newsletter.ts");
    console.log("Newsletter stdout:", stdout);
    if (stderr) console.error("Newsletter stderr:", stderr);
    
    return { success: true, message: "Proceso de envío finalizado. Revisa los logs para detalles." };
  } catch (error: any) {
    console.error("Manual newsletter send error:", error);
    return { success: false, error: `Error al ejecutar el envío: ${error.message}` };
  }
}
