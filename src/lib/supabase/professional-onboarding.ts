import { supabase } from "@/lib/supabaseClient";

export async function markProfessionalClinicFlow(): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("mark_professional_clinic_flow");
  if (error) return { ok: false, error: error.message };
  const payload = data as { ok?: boolean; error?: string } | null;
  if (!payload?.ok) {
    const code = payload?.error ?? "unknown";
    const msg =
      code === "already_clinical"
        ? "Esta conta já tem acesso profissional."
        : code === "not_authenticated"
          ? "Sessão expirada."
          : "Não foi possível registrar a escolha.";
    return { ok: false, error: msg };
  }
  return { ok: true };
}

export async function clearProfessionalOnboardingChoice(): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("clear_professional_onboarding_choice");
  if (error) return { ok: false, error: error.message };
  const payload = data as { ok?: boolean; error?: string } | null;
  if (!payload?.ok) return { ok: false, error: payload?.error ?? "clear_failed" };
  return { ok: true };
}
