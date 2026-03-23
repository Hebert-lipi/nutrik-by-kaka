import { supabase } from "@/lib/supabaseClient";
import type { BodyFormula } from "@/lib/clinical/assessment-math";
import type { NutritionActivityLevel, NutritionGoal, PatientSex } from "@/lib/draft-storage";

export type PatientAssessmentRow = {
  id: string;
  nutritionist_user_id: string;
  patient_id: string;
  assessment_date: string;
  weight_kg: number | null;
  height_cm: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  abdomen_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  calf_cm: number | null;
  triceps_mm: number | null;
  biceps_mm: number | null;
  subscapular_mm: number | null;
  suprailiac_mm: number | null;
  abdominal_mm: number | null;
  chest_skinfold_mm: number | null;
  midaxillary_mm: number | null;
  thigh_skinfold_mm: number | null;
  calf_skinfold_mm: number | null;
  sex_at_assessment: PatientSex | null;
  age_at_assessment: number | null;
  activity_level_snapshot: NutritionActivityLevel | null;
  goal_snapshot: NutritionGoal | null;
  body_formula: BodyFormula | null;
  body_density: number | null;
  body_fat_pct: number | null;
  fat_mass_kg: number | null;
  lean_mass_kg: number | null;
  plan_id_snapshot: string | null;
  plan_title_snapshot: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type UpsertPatientAssessmentInput = Partial<Omit<PatientAssessmentRow, "id" | "nutritionist_user_id" | "created_at" | "updated_at">> & {
  id?: string;
  patient_id: string;
  assessment_date: string;
};

export async function fetchAssessmentsByPatient(patientId: string): Promise<PatientAssessmentRow[]> {
  const { data, error } = await supabase
    .from("patient_assessments")
    .select("*")
    .eq("patient_id", patientId)
    .order("assessment_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PatientAssessmentRow[];
}

export async function upsertAssessment(input: UpsertPatientAssessmentInput): Promise<void> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error(userErr?.message ?? "Não autenticado");
  const payload = {
    id: input.id,
    nutritionist_user_id: userData.user.id,
    ...input,
  };
  const { error } = await supabase.from("patient_assessments").upsert(payload, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

export async function removeAssessment(id: string): Promise<void> {
  const { error } = await supabase.from("patient_assessments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

