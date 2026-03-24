"use client";

import * as React from "react";
import {
  buildDashboardSnapshot,
  type DashboardSnapshot,
  type DietPlanVersionEvent,
} from "@/lib/clinical/dashboard-snapshot";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";
import { useSupabaseDietPlans } from "@/hooks/use-supabase-diet-plans";
import { supabase } from "@/lib/supabaseClient";

export type DashboardSnapshotState = DashboardSnapshot & {
  loading: boolean;
  error: string | null;
};

export function useDashboardSnapshot(): DashboardSnapshotState {
  const { patients, loading: lp, error: ep } = useSupabasePatients();
  const { plans, loading: lpl, error: epl } = useSupabaseDietPlans();
  const [versionEvents, setVersionEvents] = React.useState<DietPlanVersionEvent[]>([]);

  React.useEffect(() => {
    if (lp || lpl) return;
    let cancelled = false;
    void (async () => {
      const { data, error: vErr } = await supabase
        .from("diet_plan_versions")
        .select("id, plan_id, created_at")
        .order("created_at", { ascending: false })
        .limit(40);
      if (cancelled) return;
      if (!vErr && data) setVersionEvents(data as DietPlanVersionEvent[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [plans.length, patients.length, lp, lpl]);

  const snap = React.useMemo(
    () => buildDashboardSnapshot(patients, plans, versionEvents),
    [patients, plans, versionEvents],
  );
  return {
    ...snap,
    loading: lp || lpl,
    error: ep ?? epl,
  };
}
