import { supabase } from "@/lib/supabaseClient";
import type { DietPlanStructureJson } from "@/lib/supabase/plan-mapper";

/**
 * PostgREST retorna isso quando a tabela ainda não existe no projeto ou não está no cache da API
 * (migration `20260321130000_adherence_versions_ack.sql` não aplicada, ou projeto precisa de restart).
 */
function isMissingTableSchemaCacheError(message: string, tableSqlName: string): boolean {
  const m = message.toLowerCase();
  const short = tableSqlName.replace(/^public\./, "").toLowerCase();
  if (!m.includes(short)) return false;
  return (
    m.includes("schema cache") ||
    m.includes("could not find the table") ||
    m.includes("pgrst205")
  );
}

export type DietPlanVersionRow = {
  id: string;
  plan_id: string;
  structure_json: DietPlanStructureJson | Record<string, unknown>;
  created_at: string;
  created_by: string | null;
};

export async function insertDietPlanVersion(
  planId: string,
  structureJson: DietPlanStructureJson | Record<string, unknown>,
  createdBy: string | null,
): Promise<void> {
  const { error } = await supabase.from("diet_plan_versions").insert({
    plan_id: planId,
    structure_json: structureJson as Record<string, unknown>,
    created_by: createdBy,
  });
  if (!error) return;
  if (isMissingTableSchemaCacheError(error.message, "public.diet_plan_versions")) {
    console.warn(
      "[Nutrik] Tabela diet_plan_versions indisponível na API. Aplique no Supabase: supabase/migrations/20260321130000_adherence_versions_ack.sql — o plano foi salvo em diet_plans.",
    );
    return;
  }
  throw new Error(error.message);
}

export async function fetchPlanVersions(planId: string): Promise<DietPlanVersionRow[]> {
  const { data, error } = await supabase
    .from("diet_plan_versions")
    .select("id, plan_id, structure_json, created_at, created_by")
    .eq("plan_id", planId)
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) {
    if (isMissingTableSchemaCacheError(error.message, "public.diet_plan_versions")) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as DietPlanVersionRow[];
}

export async function fetchLatestVersionTime(planId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("diet_plan_versions")
    .select("created_at")
    .eq("plan_id", planId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  const row = data as { created_at?: string } | null;
  return row?.created_at ?? null;
}

export async function fetchPatientPlanAck(patientId: string, planId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("patient_plan_ack")
    .select("last_acknowledged_at")
    .eq("patient_id", patientId)
    .eq("plan_id", planId)
    .maybeSingle();
  if (error) return null;
  const row = data as { last_acknowledged_at?: string } | null;
  return row?.last_acknowledged_at ?? null;
}

export async function upsertPatientPlanAck(patientId: string, planId: string, acknowledgedAtIso: string): Promise<void> {
  const { error } = await supabase.from("patient_plan_ack").upsert(
    {
      patient_id: patientId,
      plan_id: planId,
      last_acknowledged_at: acknowledgedAtIso,
    },
    { onConflict: "patient_id,plan_id" },
  );
  if (error) throw new Error(error.message);
}

/** Na primeira visita, alinha o ack à última versão para não exibir falso “atualização”. */
export async function ensurePatientPlanAckBaseline(patientId: string, planId: string): Promise<void> {
  const latest = await fetchLatestVersionTime(planId);
  const existing = await fetchPatientPlanAck(patientId, planId);
  if (existing) return;
  const ts = latest ?? new Date().toISOString();
  await upsertPatientPlanAck(patientId, planId, ts);
}
