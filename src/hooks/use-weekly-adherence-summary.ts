"use client";

import * as React from "react";
import { fetchAdherenceLogsForPatient, type AdherenceLogRow } from "@/lib/supabase/patient-adherence-db";
import { formatPortalYmd } from "@/lib/clinical/patient-portal-dates";

export type DayAdherenceSummary = {
  date: string;
  completed: number;
  total: number;
};

/** Últimos 7 dias corridos (inclui hoje), agregando refeições concluídas por dia — dados já existentes em `patient_adherence_logs`. */
export function useWeeklyAdherenceSummary(
  patientId: string | undefined,
  planId: string | undefined,
  mealsPerDay: number,
  enabled: boolean,
) {
  const [rows, setRows] = React.useState<AdherenceLogRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!enabled || !patientId || !planId) {
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const all = await fetchAdherenceLogsForPatient(patientId, 220);
        if (cancelled) return;
        setRows(all.filter((r) => r.plan_id === planId));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erro ao carregar histórico");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, patientId, planId]);

  const last7Days = React.useMemo((): DayAdherenceSummary[] => {
    const total = Math.max(0, mealsPerDay);
    const out: DayAdherenceSummary[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const dateStr = formatPortalYmd(d);
      const mealLogs = rows.filter((r) => r.log_date === dateStr && r.scope === "meal");
      const completed = mealLogs.filter((r) => r.completed).length;
      out.push({ date: dateStr, completed, total });
    }
    return out;
  }, [rows, mealsPerDay]);

  const weekCompletedTotal = React.useMemo(
    () => last7Days.reduce((s, x) => s + x.completed, 0),
    [last7Days],
  );

  return { last7Days, weekCompletedTotal, loading, error };
}
