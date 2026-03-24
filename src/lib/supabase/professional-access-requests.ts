import { supabase } from "@/lib/supabaseClient";
import type { UserRole } from "@/lib/auth/user-context";
import { workspaceCutoverEnabled, workspaceDualReadEnabled } from "@/lib/feature-flags";
import { resolveActiveClinicId } from "@/lib/clinic-context";

export type ProfessionalAccessRequestRow = {
  id: string;
  user_id: string;
  requester_email: string;
  full_name: string;
  professional_registration: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string;
  target_clinic_id: string | null;
  requested_role: "clinic_admin" | "nutritionist" | null;
  created_at: string;
  updated_at: string;
};

export async function fetchMyProfileRole(): Promise<UserRole | null> {
  const { data: u } = await supabase.auth.getUser();
  const id = u.user?.id;
  if (!id) return null;
  const { data, error } = await supabase.from("profiles").select("role").eq("id", id).maybeSingle();
  if (error || !data) return "patient";
  const r = (data as { role?: string }).role;
  if (r === "nutritionist" || r === "admin" || r === "patient") return r;
  return "patient";
}

/** Escolha persistida no servidor (fluxo clínica). Não substitui validação em middleware. */
export async function fetchMyProfessionalOnboardingChoice(): Promise<"clinic" | null> {
  const { data: u } = await supabase.auth.getUser();
  const id = u.user?.id;
  if (!id) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_professional_choice")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const c = (data as { onboarding_professional_choice?: string | null }).onboarding_professional_choice;
  return c === "clinic" ? "clinic" : null;
}

export async function submitProfessionalAccessRequest(input: {
  fullName: string;
  professionalRegistration?: string;
  message?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const targetClinicId = workspaceDualReadEnabled ? await resolveActiveClinicId() : null;
  const payloadArgs = {
    p_full_name: input.fullName.trim(),
    p_professional_registration: (input.professionalRegistration ?? "").trim(),
    p_message: (input.message ?? "").trim(),
    p_target_clinic_id: targetClinicId,
  };
  let { data, error } = await supabase.rpc("submit_professional_access_request", payloadArgs);
  if (error && /function .*submit_professional_access_request.*does not exist/i.test(error.message)) {
    // Compatibilidade durante rollout da migration Fase 2.
    const fallback = await supabase.rpc("submit_professional_access_request", {
      p_full_name: payloadArgs.p_full_name,
      p_professional_registration: payloadArgs.p_professional_registration,
      p_message: payloadArgs.p_message,
    });
    data = fallback.data;
    error = fallback.error;
  }
  if (error) {
    return { ok: false, error: error.message };
  }
  const payload = data as { ok?: boolean; error?: string } | null;
  if (!payload?.ok) {
    const code = payload?.error ?? "unknown";
    const msg =
      code === "already_professional"
        ? "Esta conta já tem acesso profissional."
        : code === "already_pending"
          ? "Já existe um pedido em análise. Aguarde a resposta da clínica."
          : code === "invalid_name"
            ? "Informe seu nome completo."
            : code === "not_authenticated"
              ? "Sessão expirada. Entre novamente."
              : "Não foi possível enviar o pedido.";
    return { ok: false, error: msg };
  }
  return { ok: true };
}

export async function reviewProfessionalAccessRequest(
  requestId: string,
  approve: boolean,
  note?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc("review_professional_access_request", {
    p_request_id: requestId,
    p_approve: approve,
    p_note: (note ?? "").trim(),
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  const payload = data as { ok?: boolean; error?: string } | null;
  if (!payload?.ok) {
    const code = payload?.error ?? "unknown";
    const msg =
      code === "admin_only" || code === "forbidden"
        ? "Apenas administradores da clínica podem aprovar ou recusar pedidos."
        : code === "not_found"
          ? "Pedido não encontrado."
          : code === "already_processed"
            ? "Este pedido já foi analisado."
            : "Não foi possível concluir a ação.";
    return { ok: false, error: msg };
  }
  return { ok: true };
}

export async function fetchPendingProfessionalRequests(): Promise<ProfessionalAccessRequestRow[]> {
  const activeClinicId = workspaceDualReadEnabled || workspaceCutoverEnabled ? await resolveActiveClinicId() : null;
  const query = supabase
    .from("professional_access_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  const scoped = activeClinicId ? query.eq("target_clinic_id", activeClinicId) : query;
  const { data, error } = await scoped;
  if (error || !data) return [];
  return data as ProfessionalAccessRequestRow[];
}

export async function fetchRecentProfessionalRequests(limit = 50): Promise<ProfessionalAccessRequestRow[]> {
  const activeClinicId = workspaceDualReadEnabled || workspaceCutoverEnabled ? await resolveActiveClinicId() : null;
  const query = supabase
    .from("professional_access_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  const scoped = activeClinicId ? query.eq("target_clinic_id", activeClinicId) : query;
  const { data, error } = await scoped;
  if (error || !data) return [];
  return data as ProfessionalAccessRequestRow[];
}

export async function fetchMyProfessionalRequests(): Promise<ProfessionalAccessRequestRow[]> {
  const { data: u } = await supabase.auth.getUser();
  const id = u.user?.id;
  if (!id) return [];
  const { data, error } = await supabase
    .from("professional_access_requests")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as ProfessionalAccessRequestRow[];
}
