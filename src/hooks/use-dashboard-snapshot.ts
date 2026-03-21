"use client";

import * as React from "react";
import { buildDashboardSnapshot, type DashboardSnapshot } from "@/lib/clinical/dashboard-snapshot";
import { useDraftPatients, useDraftPlans } from "@/hooks/use-draft-data";

/** Ponte para futura troca por `fetch('/api/dashboard')` mantendo o tipo `DashboardSnapshot`. */
export function useDashboardSnapshot(): DashboardSnapshot {
  const { patients } = useDraftPatients();
  const { plans } = useDraftPlans();
  return React.useMemo(() => buildDashboardSnapshot(patients, plans), [patients, plans]);
}
