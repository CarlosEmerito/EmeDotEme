import 'dotenv/config';
import { saveImageToSupabase } from '../modules/images/image.service.ts';

async function test() {
  // Use a recent Cloudflare R2 temporary URL from logs
  const tempUrl = 'https://a223539ccf6caa2d76459c9727d276e6.r2.cloudflarestorage.com/stable-horde/239343ec-e2f0-4d3c-82f6-7ab6ab9b1f91.webp?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=246782cc9101762ba914350d8058cd83%2F20260406%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20260406T080207Z&X-Amz-Expires=1800&X-Amz-SignedHeaders=host&X-Amz-Signature=8fa30604ec17eec15ce08ad3d7508ae5e226c7ddd577bf06cbf130d26568642f';
  const slug = 'test-upload-' + Date.now();
  console.log('Testing upload of temporary image...');
  console.log('Original URL:', tempUrl);
  const permanentUrl = await saveImageToSupabase(tempUrl, slug);
  console.log('Result URL:', permanentUrl);
  if (permanentUrl !== tempUrl && permanentUrl.includes('supabase')) {
    console.log('✅ Success: Image uploaded to Supabase Storage.');
  } else {
    console.log('⚠️ No upload performed (maybe domain excluded or error).');
  }
}

test().catch(console.error);