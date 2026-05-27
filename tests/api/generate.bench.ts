import { test, describe } from "node:test";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe("Category Upsert Performance", () => {
  test("Sequential vs Concurrent", async () => {
    const categories = ["Mercados", "Tecnología", "Web3"];

    // Warm up DB connection
    await prisma.category.findMany();

    const startSeq = performance.now();
    for (const name of categories) {
      await prisma.category.upsert({
        where: { name },
        update: {},
        create: {
          name,
          slug: name.toLowerCase().replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/\s+/g, '-'),
        },
      });
    }
    const endSeq = performance.now();

    const startConc = performance.now();
    await Promise.all(
      categories.map(name =>
        prisma.category.upsert({
          where: { name },
          update: {},
          create: {
            name,
            slug: name.toLowerCase().replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/\s+/g, '-'),
          },
        })
      )
    );
    const endConc = performance.now();

    const seqTime = endSeq - startSeq;
    const concTime = endConc - startConc;

    console.log(`Sequential Time: ${seqTime.toFixed(2)}ms`);
    console.log(`Concurrent Time: ${concTime.toFixed(2)}ms`);

    // We expect concurrent to be generally faster or similar
    console.log(`Improvement: ${((seqTime - concTime) / seqTime * 100).toFixed(2)}%`);
  });
});
