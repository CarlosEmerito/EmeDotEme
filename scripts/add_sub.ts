import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addDummySubscriber() {
  await prisma.subscriber.create({
    data: {
      email: "emeritocarlos@gmail.com",
      active: true,
    }
  });
  console.log("Added dummy subscriber.");
}

addDummySubscriber();