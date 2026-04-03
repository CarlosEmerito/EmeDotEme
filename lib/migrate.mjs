import { Client } from 'pg';

const client = new Client({
  connectionString: 'postgresql://postgres.elfglqkqprwlenwjtfgj:cchhaarrlliisS1@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
});

async function main() {
  await client.connect();
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS "Category" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");
    CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");

    CREATE TABLE IF NOT EXISTS "Article" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "summary" TEXT,
        "content" TEXT NOT NULL,
        "imageUrl" TEXT,
        "author" TEXT NOT NULL DEFAULT 'EmeDotEme AI',
        "published" BOOLEAN NOT NULL DEFAULT false,
        "categoryId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "Article_slug_key" ON "Article"("slug");

    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Article_categoryId_fkey') THEN
            ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
    END;
    $$;
  `);

  console.log("Tables created successfully");
  await client.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
