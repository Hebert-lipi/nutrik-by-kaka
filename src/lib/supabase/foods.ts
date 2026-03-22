import { supabase } from "@/lib/supabaseClient";

export type FoodRow = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: string;
};

function toNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Remove caracteres que quebram ILIKE no servidor. */
export function sanitizeFoodSearchQuery(q: string): string {
  return q.replace(/[%_\\]/g, "").trim();
}

/**
 * RPC `search_foods` — autocomplete por nome.
 * Query vazia retorna amostra (útil ao focar o campo).
 */
export async function searchFoodsByName(query: string, limit = 20): Promise<FoodRow[]> {
  const safe = sanitizeFoodSearchQuery(query);
  const { data, error } = await supabase.rpc("search_foods", {
    search_query: safe,
    result_limit: limit,
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Record<string, unknown>[];
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    calories: toNum(row.calories),
    protein: toNum(row.protein),
    carbs: toNum(row.carbs),
    fat: toNum(row.fat),
    unit: String(row.unit ?? "100g"),
  }));
}
