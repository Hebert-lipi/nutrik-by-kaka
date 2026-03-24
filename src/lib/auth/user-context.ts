import type { SupabaseClient, User } from "@supabase/supabase-js";

/** Roles persistidos em `public.profiles.role`. */
export type UserRole = "patient" | "nutritionist" | "admin";

/**
 * Contexto de acesso: autorização clínica vem de `profiles.role`, não de “ter criado dados”.
 * `isPatient` = vínculo portal (`patients.auth_user_id`), usado para `/meu-plano`.
 */
export type UserAccessContext = {
  user: User;
  role: UserRole;
  /** Staff clínico: `nutritionist` ou `admin`. */
  isClinicalStaff: boolean;
  /** Existe ficha com `auth_user_id` = utilizador (após claim por e-mail). */
  isPatient: boolean;
  /**
   * Compatível com código legado: equivalente a `isClinicalStaff`.
   * @deprecated Preferir `isClinicalStaff` ou `role`.
   */
  isNutritionist: boolean;
  /** `patients.id` quando vinculado como paciente. */
  patientId: string | null;
};

export function isClinicalRole(role: UserRole): boolean {
  return role === "nutritionist" || role === "admin";
}

function parseUserRole(raw: unknown): UserRole {
  if (typeof raw === "object" && raw !== null && "role" in raw) {
    const r = String((raw as { role?: string }).role ?? "").trim();
    if (r === "nutritionist" || r === "admin" || r === "patient") return r;
  }
  return "patient";
}

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

  const [patientRow, profileRow] = await Promise.all([
    supabase.from("patients").select("id").eq("auth_user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
  ]);

  const patientId =
    patientRow.data && typeof (patientRow.data as { id?: string }).id === "string"
      ? (patientRow.data as { id: string }).id
      : null;

  const isPatient = Boolean(patientId);
  const role: UserRole = profileRow.error ? "patient" : parseUserRole(profileRow.data);
  const isClinicalStaff = isClinicalRole(role);

  return {
    user,
    role,
    isClinicalStaff,
    isPatient,
    isNutritionist: isClinicalStaff,
    patientId,
  };
}

/** Destino após login ou `/` autenticado: staff → área clínica; caso contrário → portal. */
export function resolvePostAuthPath(ctx: UserAccessContext): string {
  if (ctx.isClinicalStaff) return "/dashboard";
  return "/meu-plano";
}

/** Rotas da área interna (nutricionista / admin). */
export function isInternalWorkspacePath(pathname: string): boolean {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return true;
  if (pathname === "/patients" || pathname.startsWith("/patients/")) return true;
  if (pathname === "/diet-plans" || pathname.startsWith("/diet-plans/")) return true;
  if (pathname.startsWith("/pdf/")) return true;
  return false;
}
