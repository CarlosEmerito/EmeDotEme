import 'dotenv/config';
import { generateArticleContent, translateArticleContent } from "../modules/ai/ai.service";
import { fetchLatestNews } from "../modules/news/news-sources.service";
import { generateArticleImageAndAnalyzeQA } from "../modules/images/image.service";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import path from "path";

const prisma = new PrismaClient();

/**
 * Convierte un título a sentence case (solo primera letra mayúscula).
 * Preserva nombres propios, siglas y símbolos como $, %.
 */
function toSentenceCase(title: string): string {
  console.log(`🔧 toSentenceCase input: "${title}"`);
  if (!title || title.length === 0) return title;
  
  // Lista de palabras que deben mantenerse en mayúsculas (siglas/acrónimos)
  const keepUpperCase = [
    'BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOT', 'AVAX', 'MATIC', 'DOGE', 'SHIB', 'TON', 'BNB',
    'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KRW',
    'ETF', 'SEC', 'CFTC', 'FED', 'ECB', 'IMF', 'WTO', 'FINMA', 'ESMA',
    'AI', 'API', 'NFT', 'DAO', 'DEFI', 'CEFI', 'WEB3', 'KYC', 'AML',
    'USA', 'EEUU', 'UK', 'EU', 'ONU',
    'BTC-USD', 'ETH-USD', 'XRP-USD',
    'S&P', 'S&P 500', 'NASDAQ', 'NYSE', 'FTSE', 'DAX', 'CAC'
    // NOTA: Nombres de empresas como Coinbase, Binance, etc. van en properNouns, no aquí
  ];
  
  // Nombres propios que deben estar capitalizados (no todo uppercase)
  const properNouns: Record<string, string> = {
    'bitcoin': 'Bitcoin',
    'ethereum': 'Ethereum',
    'solana': 'Solana',
    'cardano': 'Cardano',
    'polkadot': 'Polkadot',
    'polygon': 'Polygon',
    'avalanche': 'Avalanche',
    'ripple': 'Ripple',
    'binance': 'Binance',
    'coinbase': 'Coinbase',
    'kraken': 'Kraken',
    'telegram': 'Telegram',
    'whatsapp': 'WhatsApp',
    'instagram': 'Instagram',
    'twitter': 'Twitter',
    'facebook': 'Facebook',
    'youtube': 'YouTube',
    'glassnode': 'Glassnode',
    'coingecko': 'CoinGecko',
    'coinmetrics': 'CoinMetrics',
    'deribit': 'Deribit',
    'kaiko': 'Kaiko',
    'jpmorgan': 'JP Morgan',
    'goldman sachs': 'Goldman Sachs',
    'blackrock': 'BlackRock',
    'fidelity': 'Fidelity',
    'vanguard': 'Vanguard'
  };
  
  // Convertir todo a minúsculas primero
  let lowercased = title.toLowerCase();
  
  // Capitalizar primera letra de la frase
  let sentenceCased = lowercased.charAt(0).toUpperCase() + lowercased.slice(1);
  
  // Primero: Capitalizar nombres propios (Bitcoin, Ethereum, etc.)
  for (const [lower, proper] of Object.entries(properNouns)) {
    const regex = new RegExp(`\\b${lower}\\b`, 'gi');
    sentenceCased = sentenceCased.replace(regex, proper);
  }
  
  // Segundo: Mantener siglas en mayúsculas (ETF, SEC, BTC, etc.)
  let result = sentenceCased;
  keepUpperCase.forEach(word => {
    const regex = new RegExp(`\\b${word.toLowerCase()}\\b`, 'gi');
    result = result.replace(regex, word.toUpperCase());
  });
  
  console.log(`🔧 toSentenceCase output: "${result}"`);
  return result;
}

/**
 * Normaliza el contenido del artículo asegurando mayúsculas correctas
 * para nombres de criptomonedas, siglas, y nombres propios
 */
function normalizeArticleContent(article: any): any {
  const normalized = { ...article };
  
  const termsToCapitalize: Record<string, string> = {
    'bitcoin': 'Bitcoin',
    'ethereum': 'Ethereum', 
    'solana': 'Solana',
    'cardano': 'Cardano',
    'polkadot': 'Polkadot',
    'polygon': 'Polygon',
    'avalanche': 'Avalanche',
    'ripple': 'Ripple',
    'binance': 'Binance',
    'coinbase': 'Coinbase',
    'kraken': 'Kraken',
    'telegram': 'Telegram',
    'whatsapp': 'WhatsApp',
    'instagram': 'Instagram',
    'twitter': 'Twitter',
    'facebook': 'Facebook',
    'youtube': 'YouTube',
    'glassnode': 'Glassnode',
    'coingecko': 'CoinGecko',
    'coinmetrics': 'CoinMetrics',
    'deribit': 'Deribit',
    'kaiko': 'Kaiko',
    'jpmorgan': 'JP Morgan',
    'goldman sachs': 'Goldman Sachs',
    'blackrock': 'BlackRock',
    'fidelity': 'Fidelity',
    'vanguard': 'Vanguard',
    'etf': 'ETF',
    'defi': 'DeFi',
    'nft': 'NFT',
    'web3': 'Web3',
    'dao': 'DAO',
    'sec': 'SEC',
    'cftc': 'CFTC',
    'fed': 'FED',
    'ecb': 'ECB',
    'imf': 'IMF',
    'usd': 'USD',
    'eur': 'EUR',
    'gbp': 'GBP',
    'jpy': 'JPY',
    'cny': 'CNY',
  };
  
  const fieldsToNormalize = ['title', 'summary', 'content', 'titleEn', 'summaryEn', 'contentEn'];
  
  for (const field of fieldsToNormalize) {
    if (normalized[field]) {
      let text = normalized[field];
      
      // Sanitizar escapes dobles (ej. \\n -> espacio)
      text = text.replace(/\\\\n/g, ' ').replace(/\\\\r/g, ' ').replace(/\\\\t/g, ' ');
      // También eliminar cualquier backslash solitario que pueda romper HTML
      text = text.replace(/\\\\(.)/g, '$1');
      
      for (const [lower, proper] of Object.entries(termsToCapitalize)) {
        const regex = new RegExp(`\\b${lower}\\b`, 'gi');
        text = text.replace(regex, proper);
      }
      
      // Eliminar hashtags de redes sociales (no deben estar en contenido web)
      text = text.replace(/#Criptomonedas\s*#Web3\s*#EmeDotEme/g, '')
                 .replace(/#Criptomonedas/g, '')
                 .replace(/#Web3/g, '')
                 .replace(/#EmeDotEme/g, '')
                 .replace(/\s*\n\s*\n\s*$/g, '\n'); // Limpiar líneas vacías extras al final
      
      normalized[field] = text;
    }
  }
  
  return normalized;
}

async function main() {
  console.log("=====================================================");
  console.log("🚀 INICIANDO GENERACIÓN DE ARTÍCULO LOCAL (DEBUG) 🚀");
  console.log("=====================================================\n");

  const categories = ["Mercados", "Tecnología", "Web3"];
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

  const allCategories = await prisma.category.findMany();
  const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];

  try {
    // Obtener títulos y URLs recientes para evitar repetición
    const recentArticles = await prisma.article.findMany({
      select: { title: true, sourceUrl: true },
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 20, // Aumentado para mayor cobertura de deduplicación
    });
    const recentTitles = recentArticles.map((a: { title: string }) => a.title);
    const recentSourceUrls = recentArticles
      .map((a: { sourceUrl: string | null }) => a.sourceUrl)
      .filter((url: string | null): url is string => Boolean(url));
      
    console.log(`📰 Títulos recientes para evitar: ${recentTitles.length}`);
    console.log(`📰 URLs recientes para evitar: ${recentSourceUrls.length}`);
    
    // Fetch noticias reales de fuentes fiables
    const newsContext = await fetchLatestNews(recentTitles, recentSourceUrls);
    console.log(`📰 Noticias obtenidas: ${newsContext.newsItems.length} de ${newsContext.sourcesResponded.join(', ') || 'ninguna fuente'}`);
    
    const t0 = Date.now();
    let aiResponse: any = await generateArticleContent(recentTitles, newsContext.newsItems);
    console.log('📝 ImagePrompt presente:', aiResponse.imagePrompt ? 'SÍ' : 'NO');
    if (aiResponse.imagePrompt) {
      console.log('   Prompt:', aiResponse.imagePrompt.substring(0, 100) + '...');
    }
    aiResponse = await translateArticleContent(aiResponse);
    
    // Aplicar sentence case a los títulos
    aiResponse.title = toSentenceCase(aiResponse.title);
    if (aiResponse.titleEn) {
      aiResponse.titleEn = toSentenceCase(aiResponse.titleEn);
    }
    
    // Normalizar mayúsculas en todo el contenido (cryptos, siglas, etc.)
    aiResponse = normalizeArticleContent(aiResponse);
    
    const t1 = Date.now();
    console.log(`\n⏱️ Tiempo de generación: ${((t1 - t0) / 1000).toFixed(2)} segundos`);

    const slug = aiResponse.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();

    const fallbackImages: Record<string, string[]> = {
      "Mercados": [
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1605792657660-596af9009e82?q=80&w=1200&auto=format&fit=crop",
      ],
      "Tecnología": [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop",
      ],
      "Web3": [
        "https://images.unsplash.com/photo-1639762681485-074b7f4f039a?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?q=80&w=1200&auto=format&fit=crop"
      ]
    };

    // Procesar imagen con el pipeline: fuente RSS → AI Horde × 2 → Unsplash
    // Priorizar imagen de la fuente RSS sobre sourceImageUrl del AI
    const rssImageUrl = newsContext.newsItems[0]?.imageUrl || aiResponse.sourceImageUrl;
    
    const imageData = {
      title: aiResponse.title,
      slug: slug,
      topic: randomCategory.name,
      originalPrompt: aiResponse.imagePrompt,
      summary: aiResponse.summary
    };
    
    let imageUrl: string;
    let imageCaption: string;
    
    try {
      const imageResult = await generateArticleImageAndAnalyzeQA(imageData, rssImageUrl);
      imageUrl = imageResult.imageUrl;
      imageCaption = imageResult.caption || aiResponse.imageCaption || `Ilustración sobre ${randomCategory.name}`;
      console.log(`✅ Imagen final (${imageResult.source}): ${imageUrl.substring(0, 100)}...`);
      console.log(`   Pasos: ${imageResult.attempts.join(' → ')}`);
      if (imageResult.errors.length > 0) {
        console.log(`   Errores recuperados: ${imageResult.errors.join(', ')}`);
      }
    } catch (error) {
      console.error("❌ Error crítico en pipeline de imagen:", error);
      const options = fallbackImages[randomCategory.name] || fallbackImages["Tecnología"];
      imageUrl = options[Math.floor(Math.random() * options.length)];
      imageCaption = aiResponse.imageCaption || `Ilustración sobre ${randomCategory.name}`;
    }

    console.log("\n💾 Guardando en la Base de Datos...");
    const newArticle = await prisma.article.create({
      data: {
        title: aiResponse.title,
        titleEn: aiResponse.titleEn,
        slug: slug,
        summary: aiResponse.summary,
        summaryEn: aiResponse.summaryEn,
        content: aiResponse.content,
        contentEn: aiResponse.contentEn,
        tags: aiResponse.tags || [],
        imageUrl: imageUrl,
        imageCaption: imageCaption,
        sourceUrl: aiResponse.sourceUrl || null,
        isOriginal: !(newsContext.newsItems.length > 0),
        sentiment: aiResponse.sentiment || "Neutral ➡️",
        categoryId: randomCategory.id,
        author: 'Carlos "Emérito" López Lovera',
        published: true,
      },
      include: {
        category: true,
      }
    });

    console.log("\n✅ ARTÍCULO PUBLICADO CON ÉXITO:");
    console.log(`- Título: ${newArticle.title}`);
    console.log(`- Sentimiento: ${newArticle.sentiment}`);
    console.log(`- Categoría: ${newArticle.category.name}`);
    console.log(`- URL Imagen: ${newArticle.imageUrl}`);
    console.log(`- Resumen: ${newArticle.summary}`);
    
    // Guardar un archivo temporal para Binance Square
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
    
    const articleData = {
      title: newArticle.title,
      link: `https://www.emedoteme.es/articulo/${newArticle.slug}`,
      description: newArticle.content || newArticle.summary,
      imageUrl: newArticle.imageUrl,
      sentiment: newArticle.sentiment
    };
    
    const jsonPath = path.join(tmpDir, 'latest_article.json');
    fs.writeFileSync(jsonPath, JSON.stringify(articleData, null, 2));
    console.log(`\n💾 Datos guardados en ${jsonPath} para Binance Square.`);
    
  } catch (error) {
    console.error("\n❌ ERROR DURANTE EL PROCESO:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
