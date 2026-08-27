import { createClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_URL = 'https://zjpywlnehorrdrnrasxi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_s7DstU3Vf59CY6H-FrsmlQ_GYsCF0UI';

const rawUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  SUPABASE_PROJECT_URL;

const rawKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  SUPABASE_ANON_KEY;

export const supabaseUrl = rawUrl.trim().replace(/^["']|["']$/g, '');
export const supabaseAnonKey = rawKey.trim().replace(/^["']|["']$/g, '');

export const isSupabaseConfigured = true;

// العميل الأساسي المباشر لقاعدة بيانات Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
