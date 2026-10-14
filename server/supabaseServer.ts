import fs from 'node:fs';
import path from 'node:path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { StudentRegistration, StallRegistrationRecord } from './db.ts';

/**
 * Server-Side Supabase Integration
 * NOTE: This module runs EXCLUSIVELY on the Node.js backend (Vite middleware / server).
 * It is NEVER bundled or exposed to frontend browsers.
 */

// Helper to safely load environment variables from .env.local in Node
function getEnvVariables(): Record<string, string> {
  const envMap: Record<string, string> = {};
  const envPath = path.resolve(process.cwd(), '.env.local');

  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          envMap[key] = val;
        }
      }
    } catch (err) {
      console.error('[Supabase Server] Error reading .env.local:', err);
    }
  }

  return envMap;
}

const localEnv = getEnvVariables();
const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  localEnv.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  localEnv.SUPABASE_URL;

// Secret Service Role Key (if available) or fallback to anon/publishable key
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  localEnv.SUPABASE_SERVICE_ROLE_KEY;

const effectiveKey =
  (serviceRoleKey &&
  !serviceRoleKey.includes('your-secret-service-role-key') &&
  serviceRoleKey.length > 20
    ? serviceRoleKey
    : null) ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  localEnv.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  localEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  localEnv.SUPABASE_ANON_KEY;

let serverClient: SupabaseClient | null = null;

if (
  supabaseUrl &&
  effectiveKey &&
  typeof effectiveKey === 'string' &&
  effectiveKey.length > 20
) {
  try {
    serverClient = createClient(supabaseUrl, effectiveKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('[Supabase Server] Initialized client for live backend database queries.');
  } catch (err) {
    console.error('[Supabase Server] Failed to initialize client:', err);
  }
}

/**
 * Checks whether the server has an active Supabase Service Role client configured.
 */
export function isSupabaseServerConfigured(): boolean {
  return serverClient !== null;
}

/**
 * Fetches all student registrations directly from Supabase table 'student_registrations'.
 */
export async function fetchStudentsFromSupabase(): Promise<StudentRegistration[] | null> {
  if (!serverClient) return null;

  try {
    const { data, error } = await serverClient
      .from('student_registrations')
      .select('id, roll_number, full_name, department, semester, pass_code, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase Server] Error querying student_registrations:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: String(row.id),
      rollNo: String(row.roll_number || ''),
      name: String(row.full_name || ''),
      department: row.department as 'BBA' | 'BCA',
      semester: String(row.semester || ''),
      passCode: String(row.pass_code || ''),
      createdAt: String(row.created_at || new Date().toISOString()),
    }));
  } catch (err) {
    console.error('[Supabase Server] Unexpected error fetching students:', err);
    return null;
  }
}

/**
 * Fetches all stall registrations directly from Supabase table 'stall_registrations'.
 */
export async function fetchStallsFromSupabase(): Promise<StallRegistrationRecord[] | null> {
  if (!serverClient) return null;

  try {
    const { data, error } = await serverClient
      .from('stall_registrations')
      .select('id, registration_category, stall_name, owner_full_name, stall_type, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase Server] Error querying stall_registrations:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: String(row.id),
      registration_category: row.registration_category as 'BBA' | 'BCA' | 'Others',
      stall_name: String(row.stall_name || ''),
      owner_full_name: String(row.owner_full_name || ''),
      stall_type: row.stall_type as 'Food' | 'Art' | 'Beverages' | 'Other',
      createdAt: String(row.created_at || new Date().toISOString()),
    }));
  } catch (err) {
    console.error('[Supabase Server] Unexpected error fetching stalls:', err);
    return null;
  }
}
