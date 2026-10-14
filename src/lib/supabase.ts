import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Centralized Supabase Client for RANGVAASA 2026
 *
 * Reads credentials strictly from Vite environment variables:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY)
 *
 * Security Note:
 * - Only use the public/publishable anon key here.
 * - Never use the service_role secret key in frontend client code.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Validates whether valid, non-placeholder Supabase credentials exist.
 */
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
    typeof supabaseUrl === 'string' &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('YOUR_PROJECT_ID') &&
    supabaseKey &&
    typeof supabaseKey === 'string' &&
    !supabaseKey.includes('YOUR_SUPABASE_PUBLISHABLE_KEY') &&
    !supabaseKey.includes('YOUR_SUPABASE_ANON_KEY')
);

// Singleton Supabase Client
let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  supabaseInstance = createClient(supabaseUrl as string, supabaseKey as string, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Returns the centralized Supabase client instance.
 * Throws a clear configuration error if environment variables are missing or unconfigured.
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    throw new Error(
      '[Supabase] Client is not configured. Please define valid VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env.local file.'
    );
  }
  return supabaseInstance;
}

/**
 * Default exported client instance (null when unconfigured).
 */
export const supabase = supabaseInstance;
