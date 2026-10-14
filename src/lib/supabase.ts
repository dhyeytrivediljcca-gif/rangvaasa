import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Centralized Supabase Client for RANGVAASA 2026
 *
 * Reads credentials from environment variables, supporting:
 * - VITE_SUPABASE_URL / SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY / SUPABASE_ANON_KEY / SUPABASE_KEY
 */

const env = import.meta.env;

const supabaseUrl: string | undefined =
  env.VITE_SUPABASE_URL ||
  (env as any).SUPABASE_URL ||
  (env as any).NEXT_PUBLIC_SUPABASE_URL;

const supabaseKey: string | undefined =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  (env as any).SUPABASE_ANON_KEY ||
  (env as any).SUPABASE_KEY ||
  (env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

if (isSupabaseConfigured && supabaseUrl && supabaseKey) {
  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

/**
 * Returns the centralized Supabase client instance.
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    throw new Error(
      '[Supabase] Client is not configured. Please define valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.'
    );
  }
  return supabaseInstance;
}

/**
 * Default exported client instance (null when unconfigured).
 */
export const supabase = supabaseInstance;
