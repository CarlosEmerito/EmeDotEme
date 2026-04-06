import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking latest article for hashtags...');
  
  const article = await prisma.article.findFirst({
    where: {
      slug: 'bitcoin-etfs-al-contado-alcanzan-vol-menes-r-cord-impulsando-la-adopci-n-institucional-1775474460911'
    },
    select: {
      title: true,
      content: true,
      tags: true,
    },
  });
  
  if (!article) {
    console.log('Article not found');
    return;
  }
  
  console.log(`Title: ${article.title}`);
  console.log(`Tags: ${JSON.stringify(article.tags)}`);
  
  const hashtags = article.content.match(/#[A-Za-záéíóúñÁÉÍÓÚÑ0-9]+/g) || [];
  console.log(`Hashtags in content: ${hashtags.length > 0 ? hashtags.join(', ') : 'None'}`);
  
  // Also check for specific hashtags
  const hasCriptomonedas = article.content.includes('#Criptomonedas');
  const hasWeb3 = article.content.includes('#Web3');
  const hasEmeDotEme = article.content.includes('#EmeDotEme');
  
  console.log(`\nSpecific hashtags check:`);
  console.log(`  #Criptomonedas: ${hasCriptomonedas ? 'YES' : 'No'}`);
  console.log(`  #Web3: ${hasWeb3 ? 'YES' : 'No'}`);
  console.log(`  #EmeDotEme: ${hasEmeDotEme ? 'YES' : 'No'}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());