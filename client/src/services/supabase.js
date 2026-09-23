import { createClient } from '@supabase/supabase-js';

// Read from Vite environment or use project defaults
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://orynjopcmagmfwkwciyu.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_EhRdeRfuAwdgpF9LOHaGdA_P5qD7WJE';

let supabaseClient = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (err) {
    console.warn('[Supabase Realtime] Client initialization notice:', err.message);
  }
}

export const supabase = supabaseClient;
