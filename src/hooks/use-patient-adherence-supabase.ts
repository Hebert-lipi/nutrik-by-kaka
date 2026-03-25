"use client";

import * as React from "react";
import {
  fetchAdherenceLogsForDay,
  upsertDailyAdherenceNote,
  upsertMealAdherenceRow,
  type MealDifficulty,
} from "@/lib/supabase/patient-adherence-db";

export type MealAdherenceState = Record<string, { completed: boolean; difficulty: MealDifficulty }>;

function logsToMealState(logs: Awaited<ReturnType<typeof fetchAdherenceLogsForDay>>): {
  meals: MealAdherenceState;
  dailyNote: string;
} {
  const meals: MealAdherenceState = {};
  let dailyNote = "";
  for (const row of logs) {
    if (row.scope === "meal" && row.meal_id) {
      meals[row.meal_id] = {
        completed: row.completed,
        difficulty: (row.difficulty as MealDifficulty) || "none",
      };
    }
    if (row.scope === "daily") {
      dailyNote = row.notes ?? "";
    }
  }
  return { meals, dailyNote };
}

export type PatientAdherenceController = ReturnType<typeof usePatientAdherenceSupabase>;

export function usePatientAdherenceSupabase(
  patientId: string | undefined,
  planId: string | undefined,
  logDate: string,
  enabled: boolean,
) {
  const [mealState, setMealState] = React.useState<MealAdherenceState>({});
  const [dailyNote, setDailyNote] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!enabled || !patientId || !planId) {
      setMealState({});
      setDailyNote("");
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const logs = await fetchAdherenceLogsForDay(patientId, planId, logDate);
      const parsed = logsToMealState(logs);
      setMealState(parsed.meals);
      setDailyNote(parsed.dailyNote);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar adesão");
    } finally {
      setLoading(false);
    }
  }, [enabled, patientId, planId, logDate]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const setMealCompleted = React.useCallback(
    async (mealId: string, completed: boolean) => {
      if (!patientId || !planId) return;
      let payload = { completed, difficulty: "none" as MealDifficulty };
      setMealState((s) => {
        const prev = s[mealId] ?? { completed: false, difficulty: "none" as MealDifficulty };
        const next = { ...prev, completed };
        payload = { completed: next.completed, difficulty: next.difficulty };
        return { ...s, [mealId]: next };
      });
      try {
        await upsertMealAdherenceRow({
          patientId,
          planId,
          mealId,
          logDate,
          completed: payload.completed,
          difficulty: payload.difficulty,
        });
      } catch {
        await load();
      }
    },
    [patientId, planId, logDate, load],
  );

  const setMealDifficulty = React.useCallback(
    async (mealId: string, difficulty: MealDifficulty) => {
      if (!patientId || !planId) return;
      let payload = { completed: false, difficulty };
      setMealState((s) => {
        const prev = s[mealId] ?? { completed: false, difficulty: "none" as MealDifficulty };
        const next = { ...prev, difficulty };
        payload = { completed: next.completed, difficulty: next.difficulty };
        return { ...s, [mealId]: next };
      });
      try {
        await upsertMealAdherenceRow({
          patientId,
          planId,
          mealId,
          logDate,
          completed: payload.completed,
          difficulty: payload.difficulty,
        });
      } catch {
        await load();
      }
    },
    [patientId, planId, logDate, load],
  );

  const saveDailyNote = React.useCallback(
    async (notes: string) => {
      if (!patientId || !planId) return;
      setDailyNote(notes);
      try {
        await upsertDailyAdherenceNote({ patientId, planId, logDate, notes });
      } catch {
        await load();
      }
    },
    [patientId, planId, logDate, load],
  );

  return {
    mealState,
    dailyNote,
    loading,
    error,
    reload: load,
    setMealCompleted,
    setMealDifficulty,
    saveDailyNote,
  };
}
