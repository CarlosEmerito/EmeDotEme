import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    // Validaciones básicas
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    // Validaciones de tipo
    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return NextResponse.json({ error: "Formato de datos inválido" }, { status: 400 });
    }

    // Validaciones de longitud
    if (name.length > 100) {
      return NextResponse.json({ error: "El nombre es demasiado largo (máximo 100 caracteres)" }, { status: 400 });
    }

    if (email.length > 255) {
      return NextResponse.json({ error: "El email es demasiado largo (máximo 255 caracteres)" }, { status: 400 });
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: "El mensaje es demasiado largo (máximo 5000 caracteres)" }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // Sanitización básica para prevenir inyección HTML en el correo
    const escapeHtml = (unsafe: string) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message);

    // Verificar si Resend está configurado
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey || resendApiKey.trim() === '') {
      console.error("Resend no está configurado. API key faltante o vacía.");
      
      // En desarrollo, simular éxito para permitir testing
      if (process.env.NODE_ENV === "development") {
        console.log("Email simulado (desarrollo):", { name, email, message });
        return NextResponse.json({ 
          success: true, 
          message: "Mensaje simulado (RESEND_API_KEY no configurada en desarrollo)" 
        });
      }
      
      return NextResponse.json({ error: "Servicio de email no configurado" }, { status: 503 });
    }

    // Inicializar Resend solo cuando sea necesario
    const resend = new Resend(resendApiKey);

    // Enviar email al administrador (Carlos)
    const { data: _, error } = await resend.emails.send({
      from: "Contacto EmeDotEme <contacto@emedoteme.es>",
      to: ["carlosemerito13@gmail.com"],
      subject: `Nuevo mensaje de contacto de ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Nuevo mensaje de contacto desde EmeDotEme</h2>
          <p><strong>Nombre:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Mensaje:</strong></p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
            ${safeMessage.replace(/\n/g, '<br>')}
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">Este mensaje fue enviado desde el formulario de contacto de EmeDotEme.</p>
        </div>
      `,
      text: `Nombre: ${name}\nEmail: ${email}\nMensaje:\n${message}`,
    });

    if (error) {
      return NextResponse.json({ error: "Error al enviar el mensaje" }, { status: 500 });
    }

    // Enviar copia de confirmación al usuario (opcional)
    await resend.emails.send({
      from: "Contacto EmeDotEme <contacto@emedoteme.es>",
      to: [email],
      subject: "Confirmación de contacto - EmeDotEme",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">¡Gracias por contactarnos!</h2>
          <p>Hemos recibido tu mensaje y te responderemos lo antes posible.</p>
          <p><strong>Resumen de tu mensaje:</strong></p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
            ${safeMessage.replace(/\n/g, '<br>')}
          </div>
          <p>Saludos,<br>El equipo de EmeDotEme</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">Este es un mensaje automático, por favor no respondas a este email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "Mensaje enviado correctamente" });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}