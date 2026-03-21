export type DraftPatient = {
  id: string;
  name: string;
  email: string;
  planLabel: string;
};

export type PlanFoodUnit = "g" | "ml" | "unidade";

export type DraftPlanFood = {
  id: string;
  name: string;
  quantity: number;
  unit: PlanFoodUnit;
  /** vazio no JSON pode ser omitido; na UI tratamos como string */
  note?: string;
};

export type DraftPlanMeal = {
  id: string;
  name: string;
  items: DraftPlanFood[];
};

export type DraftPlan = {
  id: string;
  name: string;
  description: string;
  status: "draft" | "published";
  /** Pacientes vinculados (opcional / número informativo) */
  patientCount: number;
  meals: DraftPlanMeal[];
};

const UNITS: PlanFoodUnit[] = ["g", "ml", "unidade"];

export function isPlanFoodUnit(u: string): u is PlanFoodUnit {
  return UNITS.includes(u as PlanFoodUnit);
}

export function createEmptyFoodItem(): DraftPlanFood {
  return {
    id: crypto.randomUUID(),
    name: "",
    quantity: 0,
    unit: "g",
    note: "",
  };
}

export function createEmptyMeal(name = "Nova refeição"): DraftPlanMeal {
  return {
    id: crypto.randomUUID(),
    name,
    items: [createEmptyFoodItem()],
  };
}

const PATIENTS_KEY = "nutrik.draft.patients.v1";
const PLANS_KEY = "nutrik.draft.plans.v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeFood(raw: unknown): DraftPlanFood {
  if (!raw || typeof raw !== "object") return createEmptyFoodItem();
  const o = raw as Record<string, unknown>;
  const qty = Number(o.quantity);
  const unitStr = typeof o.unit === "string" ? o.unit : "g";
  return {
    id: typeof o.id === "string" ? o.id : crypto.randomUUID(),
    name: typeof o.name === "string" ? o.name : "",
    quantity: Number.isFinite(qty) ? qty : 0,
    unit: isPlanFoodUnit(unitStr) ? unitStr : "g",
    note: typeof o.note === "string" ? o.note : "",
  };
}

function normalizeMeal(raw: unknown): DraftPlanMeal {
  if (!raw || typeof raw !== "object") return createEmptyMeal();
  const o = raw as Record<string, unknown>;
  const itemsRaw = o.items;
  const items = Array.isArray(itemsRaw) ? itemsRaw.map(normalizeFood) : [];
  return {
    id: typeof o.id === "string" ? o.id : crypto.randomUUID(),
    name: typeof o.name === "string" && o.name.trim() ? o.name : "Refeição",
    items: items.length ? items : [createEmptyFoodItem()],
  };
}

/** Aceita planos antigos (sem `meals` / `description`) e normaliza. */
export function normalizePlan(raw: unknown): DraftPlan {
  if (!raw || typeof raw !== "object") {
    return {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      status: "draft",
      patientCount: 0,
      meals: [createEmptyMeal("Café da manhã")],
    };
  }
  const o = raw as Record<string, unknown>;
  const mealsRaw = o.meals;
  const meals = Array.isArray(mealsRaw) ? mealsRaw.map(normalizeMeal) : [];
  const pc = Number(o.patientCount);
  return {
    id: typeof o.id === "string" ? o.id : crypto.randomUUID(),
    name: typeof o.name === "string" ? o.name : "",
    description: typeof o.description === "string" ? o.description : "",
    status: o.status === "published" ? "published" : "draft",
    patientCount: Number.isFinite(pc) ? Math.max(0, Math.floor(pc)) : 0,
    meals: meals.length ? meals : [createEmptyMeal("Café da manhã")],
  };
}

export function loadDraftPatients(): DraftPatient[] {
  if (typeof window === "undefined") return [];
  return safeParse<DraftPatient[]>(localStorage.getItem(PATIENTS_KEY), []);
}

export function saveDraftPatients(list: DraftPatient[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("nutrik-draft-storage"));
}

export function loadDraftPlans(): DraftPlan[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<unknown[]>(localStorage.getItem(PLANS_KEY), []);
  return parsed.map((item) => normalizePlan(item));
}

export function saveDraftPlans(list: DraftPlan[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLANS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("nutrik-draft-storage"));
}

export function getDraftPlanById(id: string): DraftPlan | null {
  return loadDraftPlans().find((p) => p.id === id) ?? null;
}

export function upsertDraftPlan(plan: DraftPlan) {
  const normalized = normalizePlan(plan);
  const list = loadDraftPlans();
  const idx = list.findIndex((p) => p.id === normalized.id);
  const next = idx >= 0 ? list.map((p, i) => (i === idx ? normalized : p)) : [...list, normalized];
  saveDraftPlans(next);
}
