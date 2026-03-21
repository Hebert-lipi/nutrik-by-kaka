import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

/**
 * Mesmo cliente do app (`supabaseClient.ts`), exposto para uso futuro.
 * `createBrowserClient` reutiliza singleton no navegador.
 */
export function getSupabaseClient(): SupabaseClient {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
