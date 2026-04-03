const Parser = require('rss-parser');
const parser = new Parser({
  customFields: {
    item: ['media:content', 'enclosure'],
  }
});

async function run() {
  const feed = await parser.parseURL('https://www.coindesk.com/arc/outboundfeeds/rss/');
  const item = feed.items[0];
  console.log(item.title);
  console.log('media:content', item['media:content']);
  console.log('enclosure', item.enclosure);
}
run();
