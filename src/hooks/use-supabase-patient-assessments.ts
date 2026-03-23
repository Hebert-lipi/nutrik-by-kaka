"use client";

import * as React from "react";
import {
  fetchAssessmentsByPatient,
  removeAssessment,
  upsertAssessment,
  type PatientAssessmentRow,
  type UpsertPatientAssessmentInput,
} from "@/lib/supabase/patient-assessments";

export function useSupabasePatientAssessments(patientId: string) {
  const [items, setItems] = React.useState<PatientAssessmentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!patientId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchAssessmentsByPatient(patientId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar avaliações.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = React.useCallback(
    async (input: UpsertPatientAssessmentInput) => {
      await upsertAssessment(input);
      await refresh();
    },
    [refresh],
  );

  const remove = React.useCallback(
    async (id: string) => {
      await removeAssessment(id);
      await refresh();
    },
    [refresh],
  );

  return { items, loading, error, refresh, save, remove };
}

