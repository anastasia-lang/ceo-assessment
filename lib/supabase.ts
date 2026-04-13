import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  // Read URL at runtime (avoid NEXT_PUBLIC_ prefix which gets inlined at build time)
  const envName = 'NEXT_PUBLIC_SUPABASE_URL';
  const url = process.env[envName];
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false },
  });

  return client;
}
