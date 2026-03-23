import type { DraftPlan } from "@/lib/draft-storage";

/** Garante plano completo para duplicar, receitas, etc. */
export async function ensureFullDietPlan(
  plan: DraftPlan,
  fetchById: (id: string) => Promise<DraftPlan | null>,
): Promise<DraftPlan> {
  if (!plan.isSummaryRow) return plan;
  const full = await fetchById(plan.id);
  return full ?? plan;
}

export async function ensureFullDietPlans(
  plans: DraftPlan[],
  fetchById: (id: string) => Promise<DraftPlan | null>,
): Promise<DraftPlan[]> {
  const summaries = plans.filter((p) => p.isSummaryRow);
  if (!summaries.length) return plans;
  const ids = [...new Set(summaries.map((p) => p.id))];
  const map = new Map<string, DraftPlan>();
  await Promise.all(
    ids.map(async (id) => {
      const full = await fetchById(id);
      if (full) map.set(id, full);
    }),
  );
  return plans.map((p) => (p.isSummaryRow ? (map.get(p.id) ?? p) : p));
}
