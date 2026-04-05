import { generateWeeklyNewsletter } from "../modules/ai/ai.service";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();

// Puedes cambiar esto por tu API Key real en el entorno o en un archivo .env
const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_dummy";
const resend = new Resend(RESEND_API_KEY);

const DRY_RUN = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";

async function main() {
  console.log("=====================================================");
  console.log("✉️  INICIANDO GENERACIÓN DE NEWSLETTER SEMANAL ✉️");
  console.log("=====================================================\n");

  try {
    // 1. Obtener los suscriptores activos
    const subscribers = await prisma.subscriber.findMany({
      where: { active: true },
    });

    if (subscribers.length === 0) {
      console.log("ℹ️ No hay suscriptores activos para enviar la newsletter. Abortando.");
      process.exit(0);
    }

    console.log(`👥 Suscriptores activos encontrados: ${subscribers.length}`);

    // 2. Obtener artículos publicados en los últimos 7 días
    const unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(unaSemanaAtras.getDate() - 7);

    const articlesThisWeek = await prisma.article.findMany({
      where: {
        published: true,
        createdAt: { gte: unaSemanaAtras },
      },
      select: {
        title: true,
        summary: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 15, // Coger hasta 15 noticias como máximo para no volver loca a la IA
    });

    if (articlesThisWeek.length === 0) {
      console.log("ℹ️ No hay artículos publicados en los últimos 7 días. Abortando.");
      process.exit(0);
    }

    console.log(`📰 Noticias publicadas esta semana: ${articlesThisWeek.length}`);

    // 3. Generar la newsletter con IA (Ollama)
    console.log("\n⚙️ Generando la newsletter semanal...");
    const t0 = Date.now();
    const { subject, htmlContent } = await generateWeeklyNewsletter(articlesThisWeek);
    const t1 = Date.now();
    console.log(`\n⏱️ Newsletter generada en: ${((t1 - t0) / 1000).toFixed(2)} segundos`);

    // 4. Preparar el diseño visual del correo
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; color: #333; background-color: #fafafa; padding: 20px;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; color: #111827; font-size: 28px; font-weight: 800;">EmeDotEme <span style="color: #2563eb;">News</span></h1>
            <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">Tu resumen cripto semanal 🗞️</p>
          </div>

          <div style="font-size: 16px;">
            ${htmlContent}
          </div>
          
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 40px 0 20px;" />
          
          <div style="text-align: center; font-size: 12px; color: #9ca3af;">
            <p>Has recibido este correo porque te suscribiste a <a href="https://www.emedoteme.es" style="color: #2563eb; text-decoration: none;">EmeDotEme</a>.</p>
            <p>El ecosistema cripto es volátil. Este boletín no es consejo financiero (DYOR).</p>
          </div>
        </div>
      </div>
    `;

    // 5. Enviar el correo
    console.log(`\n📧 Preparando envío de correos. Asunto: "${subject}"`);

    if (DRY_RUN) {
      console.log("\n⚠️ [DRY_RUN] Simulación. No se enviará ningún correo.");
      console.log("=== ASUNTO ===");
      console.log(subject);
      console.log("\n=== CONTENIDO ===");
      console.log(emailHtml);
      console.log("=================\n");
    } else {
      if (!RESEND_API_KEY) {
        console.error("❌ Faltan las credenciales de Resend (RESEND_API_KEY) para enviar el correo real.");
        process.exit(1);
      }

      // Resend permite enviar lotes Bcc o de uno en uno (hasta un limite según el plan)
      // Para este script básico, usamos send() a todos como Bcc o individualmente si la lista crece mucho.
      // Usaremos Bcc para ocultar los correos entre sí
      const toEmails = subscribers.map(s => s.email);
      
      const { data, error } = await resend.emails.send({
        from: 'EmeDotEme News <newsletter@emedoteme.es>', // Necesitas verificar este dominio en Resend
        to: ['newsletter@emedoteme.es'], // Email base
        bcc: toEmails, // Copia oculta a todos los suscriptores
        subject: subject,
        html: emailHtml,
      });

      if (error) {
        console.error("\n❌ Error enviando correo vía Resend:", error);
      } else {
        console.log(`\n✅ Newsletter enviada correctamente a ${toEmails.length} suscriptores!`);
        console.log(`📧 Resend ID: ${data?.id}`);
      }
    }

  } catch (error) {
    console.error("\n❌ ERROR DURANTE EL PROCESO DE LA NEWSLETTER:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();