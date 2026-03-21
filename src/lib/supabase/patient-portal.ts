import { supabase } from "@/lib/supabaseClient";
import type { DraftPatient, DraftPlan } from "@/lib/draft-storage";
import { dietPlanRowToDraftPlan, patientRowToDraftPatient, type DietPlanRow, type PatientRow } from "@/lib/supabase/plan-mapper";

export type MyPlanResult =
  | { kind: "no_session" }
  | { kind: "not_linked"; email: string }
  | { kind: "linked_no_plan"; patient: DraftPatient }
  | { kind: "ok"; patient: DraftPatient; plan: DraftPlan };

/**
 * Vincula auth ao paciente pelo e-mail (RPC) e busca plano publicado mais recente.
 */
export async function loadPatientPortalState(userEmail: string | null | undefined): Promise<MyPlanResult> {
  if (!userEmail?.trim()) return { kind: "no_session" };

  await supabase.rpc("claim_patient_by_email");

  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return { kind: "no_session" };

  const { data: pRow, error: pErr } = await supabase.from("patients").select("*").eq("auth_user_id", uid).maybeSingle();

  if (pErr || !pRow) {
    return { kind: "not_linked", email: userEmail };
  }

  const patient = patientRowToDraftPatient(pRow as PatientRow);

  const { data: planRows, error: plErr } = await supabase
    .from("diet_plans")
    .select("*")
    .eq("patient_id", patient.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1);

  if (plErr || !planRows?.length) {
    return { kind: "linked_no_plan", patient };
  }

  const plan = dietPlanRowToDraftPlan(planRows[0] as DietPlanRow);
  return { kind: "ok", patient, plan };
}
