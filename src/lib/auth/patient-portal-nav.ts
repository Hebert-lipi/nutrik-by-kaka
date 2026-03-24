import type { SupabaseClient, User } from "@supabase/supabase-js";
import { workspaceCutoverEnabled } from "@/lib/feature-flags";

export type PatientPortalNavContext = {
  greetingName: string;
  email: string | null;
  /** Igual a `UserAccessContext.isNutritionist` (staff clínico: nutricionista ou admin). */
  isNutritionist: boolean;
};

function clinicalRole(role: string | undefined): boolean {
  return role === "nutritionist" || role === "admin";
}

function resolveGreetingName(user: User): string {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const full = typeof meta?.full_name === "string" ? meta.full_name.trim() : "";
  const name = typeof meta?.name === "string" ? meta.name.trim() : "";
  if (full) return full;
  if (name) return name;
  const local = user.email?.split("@")[0]?.trim();
  if (local) return local;
  return "Utilizador";
}

/**
 * Contexto de navegação do portal paciente (cliente browser).
 * Replica a regra de staff clínico de `getUserContext` para o botão “voltar ao painel”.
 */
export async function fetchPatientPortalNavContext(
  supabase: SupabaseClient,
): Promise<PatientPortalNavContext | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, memberRes] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    workspaceCutoverEnabled
      ? supabase
          .from("clinic_members")
          .select("id")
          .eq("user_id", user.id)
          .eq("member_status", "active")
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null as { id: string } | null, error: null }),
  ]);

  const role = typeof profileRes.data?.role === "string" ? profileRes.data.role : "patient";
  const hasClinicMembership = Boolean(memberRes.data && !memberRes.error);
  const isClinicalStaff = workspaceCutoverEnabled ? hasClinicMembership : clinicalRole(role);

  return {
    greetingName: resolveGreetingName(user),
    email: user.email ?? null,
    isNutritionist: isClinicalStaff,
  };
}
