import { createClient } from '@supabase/supabase-js';

// These should be in .env.local usually, but for a quick demo we can start here or asking user to add them.
// Values will be empty initially.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
