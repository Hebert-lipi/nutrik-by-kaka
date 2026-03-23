import type { DraftPlan, DraftPlanMeal } from "@/lib/draft-storage";
import {
  createEmptyFoodGroup,
  createEmptyFoodOption,
  createEmptyMeal,
} from "@/lib/draft-storage";

function deepCloneMeals(meals: DraftPlanMeal[]): DraftPlanMeal[] {
  return JSON.parse(JSON.stringify(meals)) as DraftPlanMeal[];
}

/** Cópia profunda do plano com novos IDs (novo documento na biblioteca). */
export function cloneEntirePlan(plan: DraftPlan): DraftPlan {
  const baseName = plan.name.trim();
  const name = (baseName ? `Cópia de ${baseName}` : "Cópia de plano sem nome").slice(0, 160);
  const meals = deepCloneMeals(plan.meals).map((m) => ({
    ...m,
    id: crypto.randomUUID(),
    groups: m.groups.map((g) => ({
      ...g,
      id: crypto.randomUUID(),
      options: g.options.map((opt) => ({ ...opt, id: crypto.randomUUID() })),
    })),
  }));
  return {
    id: crypto.randomUUID(),
    name,
    description: plan.description,
    status: "draft",
    patientCount: 0,
    planKind: "patient_plan",
    linkedPatientId: null,
    professionalName: plan.professionalName,
    professionalRegistration: plan.professionalRegistration,
    patientHeaderLabel: plan.patientHeaderLabel,
    meals,
    revisionHistory: [],
    currentVersionNumber: 1,
    nutritionProfile: {
      sex: null,
      ageYears: null,
      weightKg: null,
      heightCm: null,
      activityLevel: null,
      goal: "maintenance",
      formula: "mifflin_st_jeor",
      adjustmentPercent: 0,
      macroMode: "hybrid",
      proteinGPerKg: 1.6,
      fatPercent: 30,
      fatGPerKg: 0.8,
      carbsPercent: 45,
      manualTargetKcal: null,
      leanMassKg: null,
      mealDistributionMode: "auto",
      mealDistribution: [],
    },
  };
}

/** Reordena refeição de `fromIndex` para `toIndex`. */
export function reorderMeals(meals: DraftPlanMeal[], fromIndex: number, toIndex: number): DraftPlanMeal[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= meals.length ||
    toIndex >= meals.length
  ) {
    return meals;
  }
  const next = [...meals];
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed!);
  return next;
}

export type NewPlanSkeletonOptions = {
  /** UUID do paciente — abre já como plano atribuído (ex.: `/diet-plans/new?patientId=…`). */
  linkedPatientId?: string | null;
  /** Pré-preenche cabeçalho do documento quando conhecido. */
  patientHeaderLabel?: string;
};

/** Estado inicial para um plano novo no construtor. */
export function createNewPlanSkeleton(opts?: NewPlanSkeletonOptions): DraftPlan {
  const linked =
    typeof opts?.linkedPatientId === "string" && opts.linkedPatientId.trim() ? opts.linkedPatientId.trim() : null;
  const header = typeof opts?.patientHeaderLabel === "string" ? opts.patientHeaderLabel.trim() : "";
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    status: "draft",
    patientCount: 0,
    planKind: linked ? "patient_plan" : "template",
    linkedPatientId: linked,
    professionalName: "",
    professionalRegistration: "",
    patientHeaderLabel: header,
    meals: [
      createEmptyMeal("Café da manhã", 0),
      createEmptyMeal("Almoço", 1),
      createEmptyMeal("Lanche", 2),
      createEmptyMeal("Jantar", 3),
    ],
    revisionHistory: [],
    currentVersionNumber: 1,
    nutritionProfile: {
      sex: null,
      ageYears: null,
      weightKg: null,
      heightCm: null,
      activityLevel: null,
      goal: "maintenance",
      formula: "mifflin_st_jeor",
      adjustmentPercent: 0,
      macroMode: "hybrid",
      proteinGPerKg: 1.6,
      fatPercent: 30,
      fatGPerKg: 0.8,
      carbsPercent: 45,
      manualTargetKcal: null,
      leanMassKg: null,
      mealDistributionMode: "auto",
      mealDistribution: [],
    },
  };
}

function newIdsForMeal(meal: DraftPlanMeal): DraftPlanMeal {
  return {
    id: crypto.randomUUID(),
    name: `${meal.name} (cópia)`,
    time: meal.time,
    observation: meal.observation,
    groups: meal.groups.map((g) => ({
      ...g,
      id: crypto.randomUUID(),
      options: g.options.map((opt) => ({ ...opt, id: crypto.randomUUID() })),
    })),
  };
}

export function duplicateMealInPlan(meals: DraftPlanMeal[], mealId: string): DraftPlanMeal[] {
  const idx = meals.findIndex((m) => m.id === mealId);
  if (idx === -1) return meals;
  const copy = newIdsForMeal(meals[idx]!);
  return [...meals.slice(0, idx + 1), copy, ...meals.slice(idx + 1)];
}

export function moveMeal(meals: DraftPlanMeal[], mealId: string, dir: -1 | 1): DraftPlanMeal[] {
  const idx = meals.findIndex((m) => m.id === mealId);
  const j = idx + dir;
  if (idx === -1 || j < 0 || j >= meals.length) return meals;
  const next = [...meals];
  [next[idx], next[j]] = [next[j]!, next[idx]!];
  return next;
}

export function removeMealFromPlan(meals: DraftPlanMeal[], mealId: string): DraftPlanMeal[] {
  const next = meals.filter((m) => m.id !== mealId);
  return next.length ? next : [createEmptyMeal("Refeição", 0)];
}

export function addGroupToMeal(meals: DraftPlanMeal[], mealId: string, groupName?: string): DraftPlanMeal[] {
  return meals.map((m) =>
    m.id === mealId ? { ...m, groups: [...m.groups, createEmptyFoodGroup(groupName ?? "Novo grupo")] } : m,
  );
}

export function removeGroupFromMeal(meals: DraftPlanMeal[], mealId: string, groupId: string): DraftPlanMeal[] {
  return meals.map((m) => {
    if (m.id !== mealId) return m;
    const groups = m.groups.filter((g) => g.id !== groupId);
    return { ...m, groups: groups.length ? groups : [createEmptyFoodGroup("Grupo alimentar")] };
  });
}

export function addOptionToGroup(meals: DraftPlanMeal[], mealId: string, groupId: string): DraftPlanMeal[] {
  return meals.map((m) => {
    if (m.id !== mealId) return m;
    return {
      ...m,
      groups: m.groups.map((g) =>
        g.id === groupId ? { ...g, options: [...g.options, createEmptyFoodOption()] } : g,
      ),
    };
  });
}

export function removeOptionFromGroup(
  meals: DraftPlanMeal[],
  mealId: string,
  groupId: string,
  optionId: string,
): DraftPlanMeal[] {
  return meals.map((m) => {
    if (m.id !== mealId) return m;
    return {
      ...m,
      groups: m.groups.map((g) => {
        if (g.id !== groupId) return g;
        const options = g.options.filter((o) => o.id !== optionId);
        return { ...g, options: options.length ? options : [createEmptyFoodOption()] };
      }),
    };
  });
}

export { isPlanFoodUnit } from "@/lib/draft-storage";
