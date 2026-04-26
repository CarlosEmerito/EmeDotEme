import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  try {
    const subscriber = await prisma.subscriber.findUnique({
      where: { email }
    });

    if (!subscriber) {
      return new NextResponse(
        "<html><body><h1>No se encontró la suscripción</h1><p>El email no está en nuestra lista.</p></body></html>",
        { headers: { "Content-Type": "text/html" } }
      );
    }

    await prisma.subscriber.update({
      where: { email },
      data: { active: false }
    });

    return new NextResponse(
      "<html><body style='font-family: sans-serif; text-align: center; padding-top: 50px;'><h1>Te has dado de baja con éxito</h1><p>Sentimos verte marchar. No recibirás más correos de nuestra parte.</p><a href='https://www.emedoteme.es'>Volver a la web</a></body></html>",
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json({ error: "Error al procesar la baja" }, { status: 500 });
  }
}
