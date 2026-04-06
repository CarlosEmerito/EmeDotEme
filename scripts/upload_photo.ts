import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import 'dotenv/config';

async function upload() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const buffer = fs.readFileSync('EmeDotEme.jpg');
  
  const bucket = 'article-images';
  const fileName = 'EmeDotEme-' + Date.now() + '.jpg';

  const { data, error } = await supabase.storage.from(bucket).upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true });

  if (error) {
    console.error('Error uploading:', error);
    return;
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  console.log('UPLOADED_URL=' + publicUrl);
}

upload().catch(console.error);
