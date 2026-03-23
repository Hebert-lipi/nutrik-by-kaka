import { supabase } from "@/lib/supabaseClient";
import type { ShoppingListItem, ShoppingListQuality } from "@/lib/clinical/shopping-list";

export type ShoppingSnapshot = {
  id: string;
  patientId: string;
  planId: string;
  planVersion: number;
  planPublishedAt: string | null;
  status: "draft" | "reviewed";
  items: ShoppingListItem[];
  quality: ShoppingListQuality;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type ShoppingSnapshotRow = {
  id: string;
  patient_id: string;
  plan_id: string;
  plan_version: number;
  plan_published_at: string | null;
  status: "draft" | "reviewed";
  items_json: unknown;
  quality_json: unknown;
  notes: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: ShoppingSnapshotRow): ShoppingSnapshot {
  return {
    id: row.id,
    patientId: row.patient_id,
    planId: row.plan_id,
    planVersion: row.plan_version,
    planPublishedAt: row.plan_published_at,
    status: row.status,
    items: Array.isArray(row.items_json) ? (row.items_json as ShoppingListItem[]) : [],
    quality:
      row.quality_json && typeof row.quality_json === "object"
        ? (row.quality_json as ShoppingListQuality)
        : { totalItems: 0, missingQuantityCount: 0, unitConflictCount: 0 },
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchShoppingSnapshot(patientId: string, planId: string, planVersion: number): Promise<ShoppingSnapshot | null> {
  const { data, error } = await supabase
    .from("patient_shopping_lists")
    .select("*")
    .eq("patient_id", patientId)
    .eq("plan_id", planId)
    .eq("plan_version", planVersion)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as ShoppingSnapshotRow);
}

export async function upsertShoppingSnapshot(input: {
  patientId: string;
  planId: string;
  planVersion: number;
  planPublishedAt: string | null;
  status: "draft" | "reviewed";
  items: ShoppingListItem[];
  quality: ShoppingListQuality;
  notes: string;
}): Promise<ShoppingSnapshot> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id ?? null;
  const row = {
    patient_id: input.patientId,
    plan_id: input.planId,
    plan_version: input.planVersion,
    plan_published_at: input.planPublishedAt,
    status: input.status,
    items_json: input.items,
    quality_json: input.quality,
    notes: input.notes,
    updated_by: uid,
    created_by: uid,
  };
  const { data, error } = await supabase
    .from("patient_shopping_lists")
    .upsert(row, { onConflict: "patient_id,plan_id,plan_version" })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Não foi possível salvar a lista de compras.");
  return mapRow(data as ShoppingSnapshotRow);
}
