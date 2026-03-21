"use client";

import * as React from "react";
import { buildDashboardSnapshot, type DashboardSnapshot } from "@/lib/clinical/dashboard-snapshot";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";
import { useSupabaseDietPlans } from "@/hooks/use-supabase-diet-plans";

export type DashboardSnapshotState = DashboardSnapshot & {
  loading: boolean;
  error: string | null;
};

export function useDashboardSnapshot(): DashboardSnapshotState {
  const { patients, loading: lp, error: ep } = useSupabasePatients();
  const { plans, loading: lpl, error: epl } = useSupabaseDietPlans();
  const snap = React.useMemo(() => buildDashboardSnapshot(patients, plans), [patients, plans]);
  return {
    ...snap,
    loading: lp || lpl,
    error: ep ?? epl,
  };
}
