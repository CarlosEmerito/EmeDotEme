import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

const SITE_URL = "https://www.emedoteme.es";

function html(body: string, status = 200) {
  return new NextResponse(
    `<html><body style="font-family: sans-serif; text-align: center; padding-top: 50px;">${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = await rateLimit(`unsubscribe:${ip}`, { max: 10, windowMs: 60_000 });
  if (!allowed) {
    return html("<h1>Demasiadas solicitudes</h1><p>Inténtalo de nuevo en un minuto.</p>", 429);
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  if (!email) {
    return html("<h1>Enlace inválido</h1><p>Falta el email en el enlace de baja.</p>", 400);
  }

  const isValidToken = await verifyUnsubscribeToken(email, token);
  if (!isValidToken) {
    return html(
      "<h1>Enlace no válido</h1><p>Este enlace de baja ha caducado o no es correcto. " +
        `Usa el enlace del último correo recibido o escríbenos desde la <a href="${SITE_URL}">web</a>.</p>`,
      400
    );
  }

  try {
    const subscriber = await prisma.subscriber.findUnique({ where: { email } });

    if (!subscriber) {
      return html("<h1>No se encontró la suscripción</h1><p>El email no está en nuestra lista.</p>");
    }

    if (subscriber.active) {
      await prisma.subscriber.update({ where: { email }, data: { active: false } });
    }

    return html(
      "<h1>Te has dado de baja con éxito</h1>" +
        `<p>Sentimos verte marchar. No recibirás más correos de nuestra parte.</p><a href="${SITE_URL}">Volver a la web</a>`
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json({ error: "Error al procesar la baja" }, { status: 500 });
  }
}
