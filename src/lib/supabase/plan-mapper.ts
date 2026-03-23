import type {
  DraftPatient,
  DraftPlan,
  NutritionActivityLevel,
  NutritionGoal,
  PatientSex,
  PlanKind,
  PlanNutritionProfile,
} from "@/lib/draft-storage";
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
  /** Quando `patient_id` na linha é null (ex.: cópia aguardando vínculo), preserva tipo no editor. */
  planKind?: PlanKind;
  linkedPatientId?: string | null;
  nutritionProfile?: PlanNutritionProfile;
};

export type DietPlanRow = {
  id: string;
  nutritionist_user_id: string;
  patient_id: string | null;
  title: string;
  description: string;
  status: "draft" | "published";
  structure_json: DietPlanStructureJson | Record<string, unknown>;
  /** Snapshot servido ao paciente (portal) quando publicado; rascunho em `structure_json`. */
  published_structure_json?: DietPlanStructureJson | Record<string, unknown> | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Linha leve para listagens (sem JSONB de conteúdo). Requer migração `20260328100000_diet_plans_list_perf_columns.sql`. */
export type DietPlanListRow = {
  id: string;
  nutritionist_user_id: string;
  patient_id: string | null;
  title: string;
  description: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
  list_meals_count: number | null;
  list_plan_version: number | null;
  list_template_patient_count: number | null;
};

/** Plano publicado no portal: só snapshot (sem `structure_json` do rascunho). */
export type DietPlanPublishedPortalRow = {
  id: string;
  nutritionist_user_id: string;
  patient_id: string | null;
  title: string;
  description: string;
  status: "published";
  published_structure_json: DietPlanRow["published_structure_json"];
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Select para listagem rápida na área da nutricionista. */
export const DIET_PLAN_SELECT_LIST =
  "id,nutritionist_user_id,patient_id,title,description,status,published_at,created_at,updated_at,list_meals_count,list_plan_version,list_template_patient_count" as const;

/** Select completo para edição / PDF / duplicar. */
export const DIET_PLAN_SELECT_FULL =
  "id,nutritionist_user_id,patient_id,title,description,status,structure_json,published_structure_json,published_at,created_at,updated_at" as const;

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
  phone?: string;
  birth_date?: string | null;
  sex?: string | null;
  portal_access_active?: boolean;
  portal_can_diet_plan?: boolean;
  portal_can_recipes?: boolean;
  portal_can_materials?: boolean;
  portal_can_shopping?: boolean;
  weight_kg?: number | null;
  height_cm?: number | null;
  activity_level?: string | null;
  nutrition_goal?: string | null;
};

function mapSex(raw: string | null | undefined): PatientSex | null {
  if (!raw) return null;
  if (raw === "female" || raw === "male" || raw === "other" || raw === "unspecified") return raw;
  return null;
}

function mapActivity(raw: string | null | undefined): NutritionActivityLevel | null {
  if (!raw) return null;
  if (raw === "sedentary" || raw === "light" || raw === "moderate" || raw === "intense") return raw;
  return null;
}

function mapGoal(raw: string | null | undefined): NutritionGoal | null {
  if (!raw) return null;
  if (raw === "weight_loss" || raw === "maintenance" || raw === "muscle_gain") return raw;
  return null;
}

function asStructure(raw: unknown): DietPlanStructureJson {
  if (!raw || typeof raw !== "object") {
    return {
      meals: [],
      professionalName: "",
      professionalRegistration: "",
      patientHeaderLabel: "",
      revisionHistory: [],
      currentVersionNumber: 1,
      planKind: "template",
      linkedPatientId: null,
    };
  }
  const o = raw as Record<string, unknown>;
  const meals = Array.isArray(o.meals) ? o.meals : [];
  const rev = Array.isArray(o.revisionHistory) ? o.revisionHistory : [];
  const cv = Number(o.currentVersionNumber);
  const rawKind = o.planKind;
  const structPlanKind: PlanKind = rawKind === "patient_plan" ? "patient_plan" : "template";
  const structLinked =
    typeof o.linkedPatientId === "string" && o.linkedPatientId.trim() ? o.linkedPatientId.trim() : null;
  return {
    meals: meals as DraftPlanMeal[],
    professionalName: typeof o.professionalName === "string" ? o.professionalName : "",
    professionalRegistration: typeof o.professionalRegistration === "string" ? o.professionalRegistration : "",
    patientHeaderLabel: typeof o.patientHeaderLabel === "string" ? o.patientHeaderLabel : "",
    revisionHistory: rev as DraftPlanRevisionSnapshot[],
    currentVersionNumber: Number.isFinite(cv) ? Math.max(1, Math.floor(cv)) : 1,
    patientCount: Number.isFinite(Number(o.patientCount)) ? Math.max(0, Math.floor(Number(o.patientCount))) : undefined,
    planKind: structPlanKind,
    linkedPatientId: structLinked,
    nutritionProfile: (o.nutritionProfile ?? undefined) as PlanNutritionProfile | undefined,
  };
}

function portalMealsFromRow(row: DietPlanRow): DraftPlan["portalMeals"] {
  if (row.status !== "published") return null;
  const raw = row.published_structure_json;
  if (!raw || typeof raw !== "object") return null;
  const snap = asStructure(raw);
  return snap.meals?.length ? snap.meals : null;
}

export function dietPlanListRowToDraftPlan(row: DietPlanListRow): DraftPlan {
  const linkedPatientId =
    row.patient_id !== null && row.patient_id !== undefined && String(row.patient_id).trim()
      ? String(row.patient_id).trim()
      : null;
  const planKind: PlanKind = linkedPatientId ? "patient_plan" : "template";
  const mealsCount = Math.max(0, Math.floor(Number(row.list_meals_count) || 0));
  const version = Math.max(1, Math.floor(Number(row.list_plan_version) || 1));
  const templateUsage = Math.max(0, Math.floor(Number(row.list_template_patient_count) || 0));

  return normalizePlan({
    id: row.id,
    name: row.title,
    description: row.description,
    status: row.status,
    patientCount: linkedPatientId ? 1 : templateUsage,
    planKind,
    linkedPatientId,
    professionalName: "",
    professionalRegistration: "",
    patientHeaderLabel: "",
    meals: [],
    revisionHistory: [],
    currentVersionNumber: version,
    publishedAt: row.published_at,
    isSummaryRow: true,
    listMealsCount: mealsCount,
  });
}

/** Plano para edição na área da nutricionista (`structure_json` = rascunho em curso). */
export function dietPlanRowToDraftPlan(row: DietPlanRow): DraftPlan {
  const s = asStructure(row.structure_json);
  const rowPatientId = row.patient_id;

  const structKind = s.planKind ?? "template";
  const structLinked = s.linkedPatientId ?? null;

  const linkedPatientId =
    rowPatientId !== null && rowPatientId !== undefined && String(rowPatientId).trim()
      ? String(rowPatientId).trim()
      : structLinked;

  const planKind: PlanKind =
    rowPatientId !== null && rowPatientId !== undefined && String(rowPatientId).trim()
      ? "patient_plan"
      : structKind === "patient_plan"
        ? "patient_plan"
        : "template";

  const portalMeals = portalMealsFromRow(row);

  return normalizePlan({
    id: row.id,
    name: row.title,
    description: row.description,
    status: row.status,
    patientCount: linkedPatientId ? 1 : s.patientCount ?? 0,
    planKind,
    linkedPatientId,
    professionalName: s.professionalName,
    professionalRegistration: s.professionalRegistration,
    patientHeaderLabel: s.patientHeaderLabel,
    meals: s.meals,
    revisionHistory: s.revisionHistory,
    currentVersionNumber: s.currentVersionNumber,
    publishedAt: row.published_at,
    ...(portalMeals ? { portalMeals } : {}),
  });
}

/**
 * Plano como o paciente vê no portal: snapshot publicado ou, em legado, `structure_json`.
 */
export function dietPlanRowToDraftPlanForPortal(row: DietPlanRow): DraftPlan {
  const useSnapshot =
    row.status === "published" && row.published_structure_json && typeof row.published_structure_json === "object";
  const s = asStructure(useSnapshot ? row.published_structure_json : row.structure_json);
  const base = dietPlanRowToDraftPlan(row);
  const { portalMeals: _p, ...baseRest } = base;
  return normalizePlan({
    ...baseRest,
    meals: s.meals.length ? s.meals : base.meals,
    professionalName: s.professionalName || base.professionalName,
    professionalRegistration: s.professionalRegistration || base.professionalRegistration,
    patientHeaderLabel: s.patientHeaderLabel || base.patientHeaderLabel,
  });
}

/**
 * Portal do paciente: só `published_structure_json` (menos payload que trazer `structure_json`).
 */
export function dietPlanPublishedPortalRowToDraftPlanForPortal(row: DietPlanPublishedPortalRow): DraftPlan {
  const rawSnap =
    row.published_structure_json && typeof row.published_structure_json === "object"
      ? row.published_structure_json
      : null;
  const s = asStructure(rawSnap);
  const linkedPatientId =
    row.patient_id !== null && row.patient_id !== undefined && String(row.patient_id).trim()
      ? String(row.patient_id).trim()
      : s.linkedPatientId ?? null;
  const planKind: PlanKind = linkedPatientId ? "patient_plan" : s.planKind === "patient_plan" ? "patient_plan" : "template";
  const portalMeals = s.meals?.length ? s.meals : null;
  return normalizePlan({
    id: row.id,
    name: row.title,
    description: row.description,
    status: "published",
    patientCount: linkedPatientId ? 1 : (s.patientCount ?? 0),
    planKind,
    linkedPatientId,
    professionalName: s.professionalName,
    professionalRegistration: s.professionalRegistration,
    patientHeaderLabel: s.patientHeaderLabel,
    meals: s.meals,
    revisionHistory: s.revisionHistory,
    currentVersionNumber: s.currentVersionNumber,
    publishedAt: row.published_at,
    ...(portalMeals ? { portalMeals } : {}),
    nutritionProfile: s.nutritionProfile,
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
    planKind: plan.planKind,
    linkedPatientId: plan.linkedPatientId,
    nutritionProfile: plan.nutritionProfile,
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
    createdAt: row.created_at,
    phone: row.phone ?? "",
    birthDate: row.birth_date ?? null,
    sex: mapSex(row.sex ?? undefined),
    portalAccessActive: row.portal_access_active !== false,
    portalCanDietPlan: row.portal_can_diet_plan !== false,
    portalCanRecipes: row.portal_can_recipes !== false,
    portalCanMaterials: row.portal_can_materials !== false,
    portalCanShopping: row.portal_can_shopping !== false,
    weightKg: Number.isFinite(Number(row.weight_kg)) ? Number(row.weight_kg) : null,
    heightCm: Number.isFinite(Number(row.height_cm)) ? Number(row.height_cm) : null,
    activityLevel: mapActivity(row.activity_level ?? null),
    nutritionGoal: mapGoal(row.nutrition_goal ?? null),
  };
}
