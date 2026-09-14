import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sybhskgyffxiqujxtspa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_28KUq5xjKw5at6uHvV1Mgg_6JXIA6d7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
