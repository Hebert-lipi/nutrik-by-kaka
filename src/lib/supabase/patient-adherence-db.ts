import { supabase } from "@/lib/supabaseClient";

export type MealDifficulty = "none" | "easy" | "medium" | "hard";

export type AdherenceLogRow = {
  id: string;
  patient_id: string;
  plan_id: string;
  meal_id: string | null;
  scope: "meal" | "daily";
  log_date: string;
  completed: boolean;
  difficulty: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export async function fetchAdherenceLogsForDay(
  patientId: string,
  planId: string,
  logDate: string,
): Promise<AdherenceLogRow[]> {
  const { data, error } = await supabase
    .from("patient_adherence_logs")
    .select("*")
    .eq("patient_id", patientId)
    .eq("plan_id", planId)
    .eq("log_date", logDate);
  if (error) throw new Error(error.message);
  return (data ?? []) as AdherenceLogRow[];
}

export async function upsertMealAdherenceRow(input: {
  patientId: string;
  planId: string;
  mealId: string;
  logDate: string;
  completed: boolean;
  difficulty: string;
}): Promise<void> {
  const { data: existing, error: selErr } = await supabase
    .from("patient_adherence_logs")
    .select("id, notes")
    .eq("patient_id", input.patientId)
    .eq("plan_id", input.planId)
    .eq("log_date", input.logDate)
    .eq("scope", "meal")
    .eq("meal_id", input.mealId)
    .maybeSingle();

  if (selErr) throw new Error(selErr.message);

  const row = {
    patient_id: input.patientId,
    plan_id: input.planId,
    meal_id: input.mealId,
    scope: "meal" as const,
    log_date: input.logDate,
    completed: input.completed,
    difficulty: input.difficulty,
    notes: (existing as { notes?: string } | null)?.notes ?? "",
  };

  if (existing && typeof (existing as { id?: string }).id === "string") {
    const { error: upErr } = await supabase
      .from("patient_adherence_logs")
      .update({
        completed: row.completed,
        difficulty: row.difficulty,
      })
      .eq("id", (existing as { id: string }).id);
    if (upErr) throw new Error(upErr.message);
    return;
  }

  const { error: insErr } = await supabase.from("patient_adherence_logs").insert(row);
  if (insErr) throw new Error(insErr.message);
}

export async function upsertDailyAdherenceNote(input: {
  patientId: string;
  planId: string;
  logDate: string;
  notes: string;
}): Promise<void> {
  const { data: existing, error: selErr } = await supabase
    .from("patient_adherence_logs")
    .select("id")
    .eq("patient_id", input.patientId)
    .eq("plan_id", input.planId)
    .eq("log_date", input.logDate)
    .eq("scope", "daily")
    .maybeSingle();

  if (selErr) throw new Error(selErr.message);

  const row = {
    patient_id: input.patientId,
    plan_id: input.planId,
    meal_id: null,
    scope: "daily" as const,
    log_date: input.logDate,
    completed: false,
    difficulty: "none",
    notes: input.notes,
  };

  if (existing && typeof (existing as { id?: string }).id === "string") {
    const { error: upErr } = await supabase.from("patient_adherence_logs").update({ notes: input.notes }).eq("id", (existing as { id: string }).id);
    if (upErr) throw new Error(upErr.message);
    return;
  }

  const { error: insErr } = await supabase.from("patient_adherence_logs").insert(row);
  if (insErr) throw new Error(insErr.message);
}

/** Lista recente para a nutricionista (somente leitura). */
export async function fetchAdherenceLogsForPatient(patientId: string, limit = 40): Promise<AdherenceLogRow[]> {
  const { data, error } = await supabase
    .from("patient_adherence_logs")
    .select("*")
    .eq("patient_id", patientId)
    .order("log_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AdherenceLogRow[];
}
