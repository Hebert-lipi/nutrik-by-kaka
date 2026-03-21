/**
 * URL e chave do projeto. Prefira definir em `.env.local`:
 * NEXT_PUBLIC_SUPABASE_URL
 * NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://yabrbvamxgvfyfqfndiv.supabase.co";

export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_Yp0mhnNQsEejrGJjRHc4aA_MaSU_XGv";
