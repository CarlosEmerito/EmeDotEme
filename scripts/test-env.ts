import 'dotenv/config';

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

// Test Supabase client creation
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
} else {
  console.log('Creating Supabase client...');
  try {
    createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created successfully');
  } catch {
    console.error('Error creating Supabase client');
  }
}