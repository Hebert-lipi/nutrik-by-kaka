"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import type { DraftPatient, PatientClinicalStatus, PatientSex } from "@/lib/draft-storage";
import { patientRowToDraftPatient, type PatientRow } from "@/lib/supabase/plan-mapper";

export type NewPatientWizardInput = {
  name: string;
  email: string;
  phone: string;
  birthDate: string | null;
  sex: PatientSex | null;
  clinicalNotes: string;
  portalAccessActive: boolean;
  portalCanDietPlan: boolean;
  portalCanRecipes: boolean;
  portalCanMaterials: boolean;
  portalCanShopping: boolean;
};

export type PatientProfilePatch = Partial<{
  name: string;
  email: string;
  phone: string;
  birthDate: string | null;
  sex: PatientSex | null;
  clinicalNotes: string;
  clinicalStatus: PatientClinicalStatus;
  portalAccessActive: boolean;
  portalCanDietPlan: boolean;
  portalCanRecipes: boolean;
  portalCanMaterials: boolean;
  portalCanShopping: boolean;
}>;

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
    async (input: NewPatientWizardInput | { name: string; email: string }) => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error(userErr?.message ?? "Não autenticado");

      const base = {
        nutritionist_user_id: userData.user.id,
        full_name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        status: "active" as const,
        notes: "clinicalNotes" in input ? input.clinicalNotes.trim() : "",
      };

      const extended =
        "phone" in input
          ? {
              ...base,
              phone: input.phone.trim(),
              birth_date: input.birthDate || null,
              sex: input.sex,
              portal_access_active: input.portalAccessActive,
              portal_can_diet_plan: input.portalCanDietPlan,
              portal_can_recipes: input.portalCanRecipes,
              portal_can_materials: input.portalCanMaterials,
              portal_can_shopping: input.portalCanShopping,
            }
          : base;

      const { error: insErr } = await supabase.from("patients").insert(extended);
      if (insErr) throw new Error(insErr.message);
      await refresh();
    },
    [refresh],
  );

  const updatePatient = React.useCallback(
    async (id: string, patch: PatientProfilePatch) => {
      const row: Record<string, unknown> = {};
      if (patch.name !== undefined) row.full_name = patch.name;
      if (patch.email !== undefined) row.email = patch.email.trim().toLowerCase();
      if (patch.clinicalStatus !== undefined) row.status = patch.clinicalStatus as PatientClinicalStatus;
      if (patch.clinicalNotes !== undefined) row.notes = patch.clinicalNotes;
      if (patch.phone !== undefined) row.phone = patch.phone.trim();
      if (patch.birthDate !== undefined) row.birth_date = patch.birthDate || null;
      if (patch.sex !== undefined) row.sex = patch.sex;
      if (patch.portalAccessActive !== undefined) row.portal_access_active = patch.portalAccessActive;
      if (patch.portalCanDietPlan !== undefined) row.portal_can_diet_plan = patch.portalCanDietPlan;
      if (patch.portalCanRecipes !== undefined) row.portal_can_recipes = patch.portalCanRecipes;
      if (patch.portalCanMaterials !== undefined) row.portal_can_materials = patch.portalCanMaterials;
      if (patch.portalCanShopping !== undefined) row.portal_can_shopping = patch.portalCanShopping;

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
