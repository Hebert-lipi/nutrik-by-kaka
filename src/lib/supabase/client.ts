import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getEnvUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function getEnvAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;

  const url = getEnvUrl();
  const key = getEnvAnonKey();

  if (!url || !key) return null;

  _client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  });

  return _client;
}

