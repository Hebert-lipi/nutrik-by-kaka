"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import type {
  DraftPatient,
  NutritionActivityLevel,
  NutritionGoal,
  PatientClinicalStatus,
  PatientSex,
} from "@/lib/draft-storage";
import { patientRowToDraftPatient, type PatientRow } from "@/lib/supabase/plan-mapper";
import { measurePerf } from "@/lib/perf/perf-metrics";

const PATIENTS_CACHE_TTL_MS = 60_000;
let patientsCache: { data: DraftPatient[]; fetchedAt: number } | null = null;
let inflightPatientsRefresh: Promise<void> | null = null;

export type NewPatientWizardInput = {
  name: string;
  email: string;
  phone: string;
  birthDate: string | null;
  sex: PatientSex | null;
  weightKg?: number | null;
  heightCm?: number | null;
  activityLevel?: NutritionActivityLevel | null;
  nutritionGoal?: NutritionGoal | null;
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
  weightKg: number | null;
  heightCm: number | null;
  activityLevel: NutritionActivityLevel | null;
  nutritionGoal: NutritionGoal | null;
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

  const refresh = React.useCallback(async (force = false) => {
    const cached = patientsCache;
    const cacheFresh = !force && cached && Date.now() - cached.fetchedAt < PATIENTS_CACHE_TTL_MS;
    if (cacheFresh) {
      setPatients(cached.data);
      setLoading(false);
      return;
    }
    if (inflightPatientsRefresh && !force) {
      await inflightPatientsRefresh;
      return;
    }
    const run = async () => {
      setLoading(true);
      setError(null);
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        setPatients([]);
        setLoading(false);
        if (userErr) setError(userErr.message);
        return;
      }

      const { data, error: qErr } = await measurePerf(
        "patients.refresh.query",
        () =>
          supabase
            .from("patients")
            .select(
              "id,nutritionist_user_id,full_name,email,status,notes,auth_user_id,created_at,updated_at,phone,birth_date,sex,portal_access_active,portal_can_diet_plan,portal_can_recipes,portal_can_materials,portal_can_shopping,weight_kg,height_cm,activity_level,nutrition_goal",
            )
            .order("created_at", { ascending: false }),
        force ? "force" : "cached-miss",
      );

      if (qErr) {
        setError(qErr.message);
        setPatients([]);
      } else {
        const mapped = (data as PatientRow[]).map(patientRowToDraftPatient);
        setPatients(mapped);
        patientsCache = { data: mapped, fetchedAt: Date.now() };
      }
      setLoading(false);
    };
    inflightPatientsRefresh = run().finally(() => {
      inflightPatientsRefresh = null;
    });
    await inflightPatientsRefresh;
  }, []);

  React.useEffect(() => {
    void refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void refresh(true);
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
              weight_kg: input.weightKg,
              height_cm: input.heightCm,
              activity_level: input.activityLevel,
              nutrition_goal: input.nutritionGoal,
              portal_access_active: input.portalAccessActive,
              portal_can_diet_plan: input.portalCanDietPlan,
              portal_can_recipes: input.portalCanRecipes,
              portal_can_materials: input.portalCanMaterials,
              portal_can_shopping: input.portalCanShopping,
            }
          : base;

      const { error: insErr } = await supabase.from("patients").insert(extended);
      if (insErr) throw new Error(insErr.message);
      await refresh(true);
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
      if (patch.weightKg !== undefined) row.weight_kg = patch.weightKg;
      if (patch.heightCm !== undefined) row.height_cm = patch.heightCm;
      if (patch.activityLevel !== undefined) row.activity_level = patch.activityLevel;
      if (patch.nutritionGoal !== undefined) row.nutrition_goal = patch.nutritionGoal;
      if (patch.portalAccessActive !== undefined) row.portal_access_active = patch.portalAccessActive;
      if (patch.portalCanDietPlan !== undefined) row.portal_can_diet_plan = patch.portalCanDietPlan;
      if (patch.portalCanRecipes !== undefined) row.portal_can_recipes = patch.portalCanRecipes;
      if (patch.portalCanMaterials !== undefined) row.portal_can_materials = patch.portalCanMaterials;
      if (patch.portalCanShopping !== undefined) row.portal_can_shopping = patch.portalCanShopping;

      if (Object.keys(row).length === 0) return;

      const { error: upErr } = await supabase.from("patients").update(row).eq("id", id);
      if (upErr) throw new Error(upErr.message);
      await refresh(true);
    },
    [refresh],
  );

  const removePatient = React.useCallback(
    async (id: string) => {
      const { error: delErr } = await supabase.from("patients").delete().eq("id", id);
      if (delErr) throw new Error(delErr.message);
      await refresh(true);
    },
    [refresh],
  );

  return { patients, loading, error, addPatient, updatePatient, removePatient, refresh };
}
