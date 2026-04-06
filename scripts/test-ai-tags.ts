import 'dotenv/config';
import { generateArticleContent } from "../modules/ai/ai.service";

async function main() {
  console.log('Testing AI article generation with tags...');
  
  try {
    const response = await generateArticleContent();
    console.log('AI Response:', JSON.stringify(response, null, 2));
    
    console.log('\n--- Analysis ---');
    console.log('Has title:', !!response.title);
    console.log('Has summary:', !!response.summary);
    console.log('Has content:', !!response.content);
    console.log('Has imagePrompt:', !!response.imagePrompt);
    console.log('Has tags:', !!response.tags);
    
    if (response.tags) {
      console.log('Tags array:', JSON.stringify(response.tags));
      console.log('Tags length:', response.tags.length);
      console.log('Tags contain hashtags:', response.tags.some((tag: string) => tag.includes('#')));
    }
    
    // Check for hashtags in content
    if (response.content) {
      const hashtags = response.content.match(/#[A-Za-záéíóúñÁÉÍÓÚÑ0-9]+/g) || [];
      console.log('Hashtags in content:', hashtags);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();