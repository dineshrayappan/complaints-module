const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

// Validate whether real credentials have been provided
const isValidUrl =
  supabaseUrl &&
  (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://')) &&
  !supabaseUrl.includes('your-project-id');

const isValidKey =
  supabaseKey &&
  supabaseKey.length > 20 &&
  !supabaseKey.includes('your-supabase');

const isSupabaseConfigured = Boolean(isValidUrl && isValidKey);

let supabase = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log(`[Supabase] Client initialized for URL: ${supabaseUrl}`);
  } catch (err) {
    console.warn(`⚠️ [Supabase] Failed to initialize Supabase client: ${err.message}`);
    supabase = null;
  }
} else {
  console.log('⚡ [Supabase] SUPABASE_URL / SUPABASE_ANON_KEY not configured in .env.');
  console.log('⚡ [Supabase] Operating in resilient fallback mode using in-memory store.');
}

const testConnection = async () => {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      console.warn('⚠️ [Supabase] Connection test returned error:', error.message);
      return false;
    }
    console.log('✅ [Supabase] Successfully connected to PostgreSQL database');
    return true;
  } catch (err) {
    console.warn('⚠️ [Supabase] Connection test failed:', err.message);
    return false;
  }
};

module.exports = {
  supabase,
  isSupabaseConfigured,
  testConnection,
};
