import 'dotenv/config';
import { generateArticleContent } from '../modules/ai/ai.service.js';

async function test() {
  console.log('Testing article generation with new prompt (tags, no hashtags)...');
  const article = await generateArticleContent();
  console.log('Title:', article.title);
  console.log('Summary:', article.summary?.substring(0, 100));
  console.log('Content length:', article.content?.length);
  console.log('Content (first 200 chars):', article.content?.substring(0, 200));
  console.log('Content (last 200 chars):', article.content?.substring(Math.max(0, article.content.length - 200)));
  console.log('ImagePrompt:', article.imagePrompt);
  console.log('Tags:', article.tags);
  // Check if hashtags present (should NOT be present)
  if (article.content && article.content.includes('#Criptomonedas')) {
    console.log('❌ ERROR: Hashtags found in content (should not be there).');
  } else {
    console.log('✅ OK: No hashtags in content.');
  }
  // Check if tags array exists
  if (article.tags && Array.isArray(article.tags) && article.tags.length > 0) {
    console.log('✅ Tags array present with', article.tags.length, 'tags.');
  } else {
    console.log('❌ WARNING: No tags array or empty.');
  }
}

test().catch(console.error);