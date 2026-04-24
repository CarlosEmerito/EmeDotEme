import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PublisherService } from "../modules/publisher/publisher.service";

const prisma = new PrismaClient();

async function main() {
  const publisher = new PublisherService(prisma);
  
  try {
    await publisher.publishDailyArticle();
  } catch (error) {
    // El error ya ha sido notificado por el servicio
    console.error("❌ Fallo en el script de publicación.");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
