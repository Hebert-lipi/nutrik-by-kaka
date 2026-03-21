import type { DraftPatient, DraftPlan } from "@/lib/draft-storage";
import { normalizePlan, type DraftPlanRevisionSnapshot, type DraftPlanMeal } from "@/lib/draft-storage";

/** Conteúdo clínico persistido em `diet_plans.structure_json`. */
export type DietPlanStructureJson = {
  meals: DraftPlanMeal[];
  professionalName: string;
  professionalRegistration: string;
  patientHeaderLabel: string;
  revisionHistory: DraftPlanRevisionSnapshot[];
  currentVersionNumber: number;
  patientCount?: number;
};

export type DietPlanRow = {
  id: string;
  nutritionist_user_id: string;
  patient_id: string | null;
  title: string;
  description: string;
  status: "draft" | "published";
  structure_json: DietPlanStructureJson | Record<string, unknown>;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PatientRow = {
  id: string;
  nutritionist_user_id: string;
  full_name: string;
  email: string;
  status: "active" | "paused" | "archived";
  notes: string;
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
};

function asStructure(raw: unknown): DietPlanStructureJson {
  if (!raw || typeof raw !== "object") {
    return {
      meals: [],
      professionalName: "",
      professionalRegistration: "",
      patientHeaderLabel: "",
      revisionHistory: [],
      currentVersionNumber: 1,
    };
  }
  const o = raw as Record<string, unknown>;
  const meals = Array.isArray(o.meals) ? o.meals : [];
  const rev = Array.isArray(o.revisionHistory) ? o.revisionHistory : [];
  const cv = Number(o.currentVersionNumber);
  return {
    meals: meals as DraftPlanMeal[],
    professionalName: typeof o.professionalName === "string" ? o.professionalName : "",
    professionalRegistration: typeof o.professionalRegistration === "string" ? o.professionalRegistration : "",
    patientHeaderLabel: typeof o.patientHeaderLabel === "string" ? o.patientHeaderLabel : "",
    revisionHistory: rev as DraftPlanRevisionSnapshot[],
    currentVersionNumber: Number.isFinite(cv) ? Math.max(1, Math.floor(cv)) : 1,
    patientCount: Number.isFinite(Number(o.patientCount)) ? Math.max(0, Math.floor(Number(o.patientCount))) : undefined,
  };
}

export function dietPlanRowToDraftPlan(row: DietPlanRow): DraftPlan {
  const s = asStructure(row.structure_json);
  const patientId = row.patient_id;
  return normalizePlan({
    id: row.id,
    name: row.title,
    description: row.description,
    status: row.status,
    patientCount: patientId ? 1 : s.patientCount ?? 0,
    planKind: patientId ? "patient_plan" : "template",
    linkedPatientId: patientId,
    professionalName: s.professionalName,
    professionalRegistration: s.professionalRegistration,
    patientHeaderLabel: s.patientHeaderLabel,
    meals: s.meals,
    revisionHistory: s.revisionHistory,
    currentVersionNumber: s.currentVersionNumber,
  });
}

export function draftPlanToStructure(plan: DraftPlan): DietPlanStructureJson {
  return {
    meals: plan.meals,
    professionalName: plan.professionalName,
    professionalRegistration: plan.professionalRegistration,
    patientHeaderLabel: plan.patientHeaderLabel,
    revisionHistory: plan.revisionHistory,
    currentVersionNumber: plan.currentVersionNumber,
    patientCount: plan.patientCount,
  };
}

export function patientRowToDraftPatient(row: PatientRow): DraftPatient {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    planLabel: "—",
    clinicalStatus: row.status,
    clinicalNotes: row.notes,
    updatedAt: row.updated_at,
  };
}
