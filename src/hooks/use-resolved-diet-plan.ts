"use client";

import * as React from "react";
import type { DraftPlan } from "@/lib/draft-storage";

/**
 * Hidrata um plano vindo da listagem leve (`isSummaryRow`) com `fetchPlanById`.
 */
export function useResolvedDietPlan(
  plan: DraftPlan | null,
  fetchPlanById: (id: string) => Promise<DraftPlan | null>,
): { plan: DraftPlan | null; loading: boolean } {
  const [resolved, setResolved] = React.useState<DraftPlan | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!plan) {
      setResolved(null);
      setLoading(false);
      return;
    }
    if (!plan.isSummaryRow) {
      setResolved(plan);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setResolved(null);
    void fetchPlanById(plan.id).then((full) => {
      if (cancelled) return;
      setResolved(full ?? plan);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [plan?.id, plan?.isSummaryRow, fetchPlanById]);

  if (!plan) return { plan: null, loading: false };
  if (!plan.isSummaryRow) return { plan, loading: false };
  return { plan: resolved ?? plan, loading };
}
