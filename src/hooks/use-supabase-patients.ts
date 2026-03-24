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
import { workspaceCutoverEnabled, workspaceDualReadEnabled } from "@/lib/feature-flags";
import { resolveActiveClinicId } from "@/lib/clinic-context";

const PATIENTS_CACHE_TTL_MS = 5 * 60_000;
let patientsCache: { data: DraftPatient[]; fetchedAt: number } | null = null;
let inflightPatientsRefresh: Promise<void> | null = null;
let patientsLoadingState = true;
let patientsErrorState: string | null = null;
let patientsBootstrapped = false;
let patientsAuthSub: { unsubscribe: () => void } | null = null;
const patientsSubscribers = new Set<(state: { patients: DraftPatient[]; loading: boolean; error: string | null }) => void>();

function patientsSnapshot() {
  return {
    patients: patientsCache?.data ?? [],
    loading: patientsLoadingState,
    error: patientsErrorState,
  };
}

function emitPatientsState() {
  const snap = patientsSnapshot();
  for (const cb of patientsSubscribers) cb(snap);
}

async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.user?.id ?? null;
}

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
  const [state, setState] = React.useState(() => patientsSnapshot());

  const refresh = React.useCallback(async (force = false) => {
    const cached = patientsCache;
    const cacheFresh = Boolean(!force && cached && Date.now() - cached.fetchedAt < PATIENTS_CACHE_TTL_MS);
    if (cached && !force) {
      patientsLoadingState = false;
      emitPatientsState();
      if (cacheFresh) return;
    }
    if (inflightPatientsRefresh && !force) {
      // Evita duplicar chamadas em montagens paralelas.
      return;
    }
    const run = async () => {
      if (!patientsCache || force) {
        patientsLoadingState = true;
        emitPatientsState();
      }
      patientsErrorState = null;
      const userId = await getCurrentUserId();
      if (!userId) {
        patientsCache = { data: [], fetchedAt: Date.now() };
        patientsLoadingState = false;
        emitPatientsState();
        return;
      }

      const useClinicPath = workspaceDualReadEnabled || workspaceCutoverEnabled;
      const queryLabel = workspaceCutoverEnabled ? "cutover" : workspaceDualReadEnabled ? "dual-read" : "legacy";
      const activeClinicId = useClinicPath ? await resolveActiveClinicId() : null;
      const baseSelect =
        "id,nutritionist_user_id,full_name,email,status,notes,auth_user_id,created_at,updated_at,phone,birth_date,sex,portal_access_active,portal_can_diet_plan,portal_can_recipes,portal_can_materials,portal_can_shopping,weight_kg,height_cm,activity_level,nutrition_goal";
      const query = supabase.from("patients").select(baseSelect).order("created_at", { ascending: false });
      const dualReadQuery = activeClinicId ? query.eq("clinic_id", activeClinicId) : query;
      const { data, error: qErr } = await measurePerf(
        "patients.refresh.query",
        () => dualReadQuery,
        `${force ? "force" : "cached-miss"}:${queryLabel}`,
      );

      if (qErr) {
        patientsErrorState = qErr.message;
        patientsCache = { data: [], fetchedAt: Date.now() };
      } else {
        let rows = (data as PatientRow[]) ?? [];
        // Fallback seguro durante dual-read. No cutover, não usa fallback legado.
        if (workspaceDualReadEnabled && !workspaceCutoverEnabled && !activeClinicId) {
          const { data: legacyData, error: legacyErr } = await supabase
            .from("patients")
            .select(baseSelect)
            .order("created_at", { ascending: false });
          if (!legacyErr && legacyData) {
            rows = legacyData as PatientRow[];
          }
        }
        const mapped = rows.map(patientRowToDraftPatient);
        patientsCache = { data: mapped, fetchedAt: Date.now() };
      }
      patientsLoadingState = false;
      emitPatientsState();
    };
    inflightPatientsRefresh = run().finally(() => {
      inflightPatientsRefresh = null;
    });
    await inflightPatientsRefresh;
  }, []);

  React.useEffect(() => {
    const cb = (next: { patients: DraftPatient[]; loading: boolean; error: string | null }) => setState(next);
    patientsSubscribers.add(cb);
    cb(patientsSnapshot());

    if (!patientsBootstrapped) {
      patientsBootstrapped = true;
      void refresh();
    }
    if (!patientsAuthSub) {
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
          void refresh(true);
        }
      });
      patientsAuthSub = sub.subscription;
    }

    return () => {
      patientsSubscribers.delete(cb);
    };
  }, [refresh]);

  const addPatient = React.useCallback(
    async (input: NewPatientWizardInput | { name: string; email: string }) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Não autenticado");

      const base = {
        nutritionist_user_id: userId,
        full_name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        status: "active" as const,
        notes: "clinicalNotes" in input ? input.clinicalNotes.trim() : "",
        clinic_id: workspaceDualReadEnabled || workspaceCutoverEnabled ? await resolveActiveClinicId() : null,
      };

      if (workspaceCutoverEnabled && !base.clinic_id) {
        throw new Error("Clínica ativa não encontrada para criação do paciente.");
      }

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

  return {
    patients: state.patients,
    loading: state.loading,
    error: state.error,
    addPatient,
    updatePatient,
    removePatient,
    refresh,
  };
}
