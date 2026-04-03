import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // Verificar si ya existe
    const existing = await prisma.subscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (!existing.active) {
        await prisma.subscriber.update({
          where: { email },
          data: { active: true },
        });
        return NextResponse.json({ success: true, message: "Suscripción reactivada" });
      }
      return NextResponse.json({ error: "Ya estás suscrito" }, { status: 400 });
    }

    await prisma.subscriber.create({
      data: { email },
    });

    return NextResponse.json({ success: true, message: "Suscrito correctamente" });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json({ error: "Error al suscribirse" }, { status: 500 });
  }
}