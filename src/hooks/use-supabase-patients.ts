"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import type { DraftPatient, PatientClinicalStatus } from "@/lib/draft-storage";
import { patientRowToDraftPatient, type PatientRow } from "@/lib/supabase/plan-mapper";

export function useSupabasePatients() {
  const [patients, setPatients] = React.useState<DraftPatient[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setError(null);
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      setPatients([]);
      setLoading(false);
      if (userErr) setError(userErr.message);
      return;
    }

    const { data, error: qErr } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (qErr) {
      setError(qErr.message);
      setPatients([]);
    } else {
      setPatients((data as PatientRow[]).map(patientRowToDraftPatient));
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const addPatient = React.useCallback(
    async (input: { name: string; email: string }) => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error(userErr?.message ?? "Não autenticado");

      const { error: insErr } = await supabase.from("patients").insert({
        nutritionist_user_id: userData.user.id,
        full_name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        status: "active",
        notes: "",
      });
      if (insErr) throw new Error(insErr.message);
      await refresh();
    },
    [refresh],
  );

  const updatePatient = React.useCallback(
    async (id: string, patch: Partial<Omit<DraftPatient, "id" | "planLabel">>) => {
      const row: Record<string, unknown> = {};
      if (patch.name !== undefined) row.full_name = patch.name;
      if (patch.email !== undefined) row.email = patch.email.trim().toLowerCase();
      if (patch.clinicalStatus !== undefined) row.status = patch.clinicalStatus as PatientClinicalStatus;
      if (patch.clinicalNotes !== undefined) row.notes = patch.clinicalNotes;

      if (Object.keys(row).length === 0) return;

      const { error: upErr } = await supabase.from("patients").update(row).eq("id", id);
      if (upErr) throw new Error(upErr.message);
      await refresh();
    },
    [refresh],
  );

  const removePatient = React.useCallback(
    async (id: string) => {
      const { error: delErr } = await supabase.from("patients").delete().eq("id", id);
      if (delErr) throw new Error(delErr.message);
      await refresh();
    },
    [refresh],
  );

  return { patients, loading, error, addPatient, updatePatient, removePatient, refresh };
}
