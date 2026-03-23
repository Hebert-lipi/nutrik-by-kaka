import { supabase } from "@/lib/supabaseClient";
import type { DraftPatient, DraftPlan } from "@/lib/draft-storage";
import {
  dietPlanPublishedPortalRowToDraftPlanForPortal,
  type DietPlanPublishedPortalRow,
} from "@/lib/supabase/plan-mapper";
import { measurePerf } from "@/lib/perf/perf-metrics";

export type MyPlanResult =
  | { kind: "no_session" }
  | { kind: "not_linked"; email: string }
  | { kind: "linked_no_plan"; patient: DraftPatient }
  | { kind: "ok"; patient: DraftPatient; plan: DraftPlan };

function portalPatientRowToDraftPatient(row: {
  id: string;
  full_name: string;
  email: string;
  portal_can_shopping?: boolean | null;
}): DraftPatient {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    planLabel: "—",
    clinicalStatus: "active",
    clinicalNotes: "",
    phone: "",
    birthDate: null,
    portalAccessActive: true,
    portalCanDietPlan: true,
    portalCanRecipes: true,
    portalCanMaterials: true,
    portalCanShopping: row.portal_can_shopping !== false,
  };
}

/**
 * Vincula auth ao paciente pelo e-mail (RPC) e busca plano publicado mais recente.
 * RLS + filtro `status = 'published'` + `patient_id` garantem que só há dados do paciente logado.
 */
export async function loadPatientPortalState(userEmail: string | null | undefined): Promise<MyPlanResult> {
  if (!userEmail?.trim()) return { kind: "no_session" };

  await measurePerf("portal.claim_patient_by_email", () => supabase.rpc("claim_patient_by_email"));

  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return { kind: "no_session" };

  const { data: pRow, error: pErr } = await measurePerf(
    "portal.patient.lookup",
    () =>
      supabase
        .from("patients")
        .select("id,full_name,email,portal_can_shopping")
        .eq("auth_user_id", uid)
        .maybeSingle(),
  );

  if (pErr || !pRow) {
    return { kind: "not_linked", email: userEmail };
  }

  const patient = portalPatientRowToDraftPatient(
    pRow as { id: string; full_name: string; email: string; portal_can_shopping?: boolean | null },
  );

  const { data: planRow, error: plErr } = await measurePerf(
    "portal.published_plan.lookup",
    () =>
      supabase
        .from("diet_plans")
        .select(
          "id,nutritionist_user_id,patient_id,title,description,status,published_structure_json,published_at,created_at,updated_at",
        )
        .eq("patient_id", patient.id)
        .eq("status", "published")
        .maybeSingle(),
  );

  if (plErr || !planRow) {
    return { kind: "linked_no_plan", patient };
  }

  const plan = dietPlanPublishedPortalRowToDraftPlanForPortal(planRow as DietPlanPublishedPortalRow);
  return { kind: "ok", patient, plan };
}
