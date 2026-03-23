import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Contexto de acesso derivado de `auth.users` + tabela `patients` (+ workspace nutricionista).
 * Usado no middleware e em qualquer verificação server-side futura.
 *
 * Regras:
 * - `isPatient`: existe linha em `patients` com `auth_user_id = user.id` (após claim por e-mail).
 * - `isNutritionist`: existe paciente ou plano com `nutritionist_user_id = user.id`.
 * - Se ambos: área interna liberada e `/meu-plano` também (plano da ficha onde `auth_user_id` = user).
 */
export type UserAccessContext = {
  user: User;
  isPatient: boolean;
  isNutritionist: boolean;
  /** `patients.id` quando o utilizador está vinculado como paciente. */
  patientId: string | null;
};

/**
 * Garante vínculo paciente ↔ auth (mesmo e-mail) antes de ler `auth_user_id`.
 */
async function runClaimPatientByEmail(supabase: SupabaseClient): Promise<void> {
  try {
    await supabase.rpc("claim_patient_by_email");
  } catch {
    /* RPC/tabela ausente em ambientes incompletos — não bloqueia */
  }
}

export async function getUserContext(
  supabase: SupabaseClient,
  user: User,
): Promise<UserAccessContext> {
  await runClaimPatientByEmail(supabase);

  const [patientRow, patientsOwned, plansOwned] = await Promise.all([
    supabase.from("patients").select("id").eq("auth_user_id", user.id).maybeSingle(),
    supabase.from("patients").select("id", { count: "exact", head: true }).eq("nutritionist_user_id", user.id),
    supabase.from("diet_plans").select("id", { count: "exact", head: true }).eq("nutritionist_user_id", user.id),
  ]);

  const patientId =
    patientRow.data && typeof (patientRow.data as { id?: string }).id === "string"
      ? (patientRow.data as { id: string }).id
      : null;

  const isPatient = Boolean(patientId);
  const nutriPatients = patientsOwned.count ?? 0;
  const nutriPlans = plansOwned.count ?? 0;
  const isNutritionist = nutriPatients > 0 || nutriPlans > 0;

  return {
    user,
    isPatient,
    isNutritionist,
    patientId,
  };
}

/** Destino após login ou `/` autenticado. */
export function resolvePostAuthPath(ctx: UserAccessContext): string {
  if (ctx.isPatient && !ctx.isNutritionist) return "/meu-plano";
  return "/dashboard";
}

/** Rotas da área interna (nutricionista / onboarding). */
export function isInternalWorkspacePath(pathname: string): boolean {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return true;
  if (pathname === "/patients" || pathname.startsWith("/patients/")) return true;
  if (pathname === "/diet-plans" || pathname.startsWith("/diet-plans/")) return true;
  return false;
}
