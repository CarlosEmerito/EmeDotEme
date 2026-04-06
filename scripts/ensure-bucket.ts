import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const bucketName = 'article-images';

async function ensureBucket() {
  try {
    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('Error listing buckets:', listError);
      // Try using REST API directly
      await createBucketViaREST();
      return;
    }
    const exists = buckets?.some(bucket => bucket.name === bucketName);
    if (exists) {
      console.log(`Bucket "${bucketName}" already exists.`);
      return;
    }
    // Create bucket using JS client (if method exists)
    // @ts-ignore
    if (typeof supabase.storage.createBucket === 'function') {
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 5242880, // 5MB
      });
      if (error) {
        console.error('Error creating bucket via JS client:', error);
        await createBucketViaREST();
      } else {
        console.log(`Bucket "${bucketName}" created successfully.`);
      }
    } else {
      await createBucketViaREST();
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

async function createBucketViaREST() {
  console.log('Attempting to create bucket via REST API...');
  const url = `${supabaseUrl}/storage/v1/bucket`;
  const headers = {
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };
  const body = JSON.stringify({
    name: bucketName,
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    fileSizeLimit: 5242880,
  });
  try {
    const response = await fetch(url, { method: 'POST', headers, body });
    if (response.ok) {
      console.log(`Bucket "${bucketName}" created via REST.`);
    } else {
      const text = await response.text();
      console.error(`REST API error: ${response.status} ${response.statusText}`, text);
      // Maybe bucket already exists? Try to ignore.
    }
  } catch (err) {
    console.error('REST API call failed:', err);
  }
}

ensureBucket().then(() => {
  console.log('Bucket check completed.');
  process.exit(0);
});