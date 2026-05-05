import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PublisherService } from "../modules/publisher/publisher.service";

const prisma = new PrismaClient();

const IA_SOURCES = [
  'mit-ai',
  'venturebeat-ai',
  'ai-news',
  'marktechpost'
];

async function main() {
  const publisher = new PublisherService(prisma);
  
  try {
    // Forzamos la publicación filtrando solo por fuentes de IA
    await publisher.publishDailyArticle(IA_SOURCES);
  } catch (error) {
    console.error("❌ Fallo en el script de publicación de IA.");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
