import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// If placeholders are still present, log a warning to the console.
const isConfigured = supabaseUrl && supabaseAnonKey && 
                     !supabaseUrl.includes('your-project') && 
                     !supabaseAnonKey.includes('your-anon-key');

if (!isConfigured) {
  console.warn(
    'Supabase has not been fully configured yet. Please update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export { isConfigured };
