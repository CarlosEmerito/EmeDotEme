import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: ['media:content', 'enclosure', 'content:encoded', 'content'],
  }
});

async function main() {
  const feeds = [
    "https://cointelegraph.com/rss",
    "https://cryptopotato.com/feed/",
    "https://www.coindesk.com/arc/outboundfeeds/rss/",
    "https://www.newsbtc.com/feed/"
  ];

  for (const url of feeds) {
    console.log(`Testing feed: ${url}`);
    try {
      const parsed = await parser.parseURL(url);
      const item = parsed.items[0];
      let imageUrl = undefined;

      if (item.enclosure && item.enclosure.url) imageUrl = item.enclosure.url;
      else if (item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url) imageUrl = item['media:content']['$'].url;
      
      if (!imageUrl && (item['content:encoded'] || item.content)) {
        const contentStr = item['content:encoded'] || item.content || '';
        const match = contentStr.match(/<img[^>]+src="([^">]+)"/i);
        if (match) imageUrl = match[1];
      }
      
      console.log(`Found Image: ${imageUrl ? 'YES - ' + imageUrl.substring(0, 40) + '...' : 'NO'}`);
    } catch (e: any) {
      console.error(`Error: ${e.message}`);
    }
  }
}

main();
