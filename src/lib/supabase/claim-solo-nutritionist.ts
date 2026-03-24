import { supabase } from "@/lib/supabaseClient";

export async function claimSoloNutritionistAccess(): Promise<{ ok: boolean; error?: string; already?: boolean }> {
  const { data, error } = await supabase.rpc("claim_solo_nutritionist_access");
  if (error) return { ok: false, error: error.message };
  const payload = data as { ok?: boolean; error?: string; already?: boolean } | null;
  if (!payload?.ok) return { ok: false, error: payload?.error ?? "rpc_failed" };
  return { ok: true, already: Boolean(payload.already) };
}
