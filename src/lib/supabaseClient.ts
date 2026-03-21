import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

/**
 * Cliente no navegador com sessão em cookies (compatível com o middleware).
 * Mantém o usuário logado ao fechar/abrir o app (refresh automático de token).
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
