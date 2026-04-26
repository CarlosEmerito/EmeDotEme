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
        keyPoints: true,
        slug: true,
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
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; color: #1f2937; background-color: #ffffff; padding: 0;">
        <div style="background-color: #000000; padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: -0.05em; text-transform: uppercase;">
            Eme<span style="color: #a78bfa;">Dot</span>Eme
          </h1>
          <p style="margin: 10px 0 0; color: #9ca3af; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: bold;">
            Inteligencia Semanal Cripto
          </p>
        </div>

        <div style="padding: 40px 30px; background-color: #ffffff;">
          <div style="font-size: 16px; color: #374151;">
            ${htmlContent}
          </div>
          
          <div style="margin-top: 40px; text-align: center;">
            <a href="https://www.emedoteme.es" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 9999px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">
              Leer todas las noticias
            </a>
          </div>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
          <div style="margin-bottom: 20px;">
            <a href="https://www.emedoteme.es" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px; font-weight: bold; text-transform: uppercase;">Web</a>
            <a href="#" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px; font-weight: bold; text-transform: uppercase;">Twitter</a>
            <a href="#" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px; font-weight: bold; text-transform: uppercase;">LinkedIn</a>
          </div>
          <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 1.5;">
            Has recibido este correo porque eres suscriptor de EmeDotEme.<br>
            © ${new Date().getFullYear()} EmeDotEme. Todos los derechos reservados.<br>
            <a href="{{UNSUBSCRIBE_LINK}}" style="color: #a78bfa; text-decoration: underline;">Darse de baja</a>
          </p>
        </div>
      </div>
    `;

    // 5. Enviar los correos
    console.log(`\n📧 Preparando envío de correos. Asunto: "${subject}"`);

    if (DRY_RUN) {
      console.log("\n⚠️ [DRY_RUN] Simulación. No se enviará ningún correo.");
      console.log("=== ASUNTO ===");
      console.log(subject);
      console.log("\n=== CONTENIDO (MUESTRA) ===");
      console.log(emailHtml.replace('{{UNSUBSCRIBE_LINK}}', 'https://www.emedoteme.es/api/unsubscribe?email=test@example.com'));
      console.log("=================\n");
    } else {
      if (!RESEND_API_KEY || RESEND_API_KEY === "re_dummy") {
        console.error("❌ Faltan las credenciales de Resend (RESEND_API_KEY) para enviar el correo real.");
        process.exit(1);
      }

      let successCount = 0;
      let failCount = 0;

      for (const subscriber of subscribers) {
        const unsubscribeLink = `https://www.emedoteme.es/api/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
        const personalizedHtml = emailHtml.replace('{{UNSUBSCRIBE_LINK}}', unsubscribeLink);

        const { error } = await resend.emails.send({
          from: 'EmeDotEme News <newsletter@emedoteme.es>',
          to: [subscriber.email],
          subject: subject,
          html: personalizedHtml,
        });

        if (error) {
          console.error(`❌ Error enviando a ${subscriber.email}:`, error);
          failCount++;
        } else {
          successCount++;
        }
      }

      console.log(`\n✅ Proceso completado: ${successCount} enviados, ${failCount} fallidos.`);
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