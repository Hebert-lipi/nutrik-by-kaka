/** Status clínico-operacional do paciente no diretório (não confundir com status do plano). */
export type PatientClinicalStatus = "active" | "paused" | "archived";

/** Sexo para ficha clínica (opcional). */
export type PatientSex = "female" | "male" | "other" | "unspecified";
export type NutritionActivityLevel = "sedentary" | "light" | "moderate" | "intense";
export type NutritionGoal = "weight_loss" | "maintenance" | "muscle_gain";
export type MetabolicFormula = "mifflin_st_jeor" | "harris_benedict" | "henry_rees" | "cunningham";

export type MacroSplitMode = "hybrid" | "percent";
export type MealDistributionMode = "auto" | "manual";
export type MealDistributionItem = {
  mealId: string;
  percent: number;
};

export type PlanNutritionProfile = {
  sex: PatientSex | null;
  ageYears: number | null;
  weightKg: number | null;
  heightCm: number | null;
  activityLevel: NutritionActivityLevel | null;
  goal: NutritionGoal | null;
  formula: MetabolicFormula;
  adjustmentPercent: number;
  macroMode: MacroSplitMode;
  proteinGPerKg: number;
  fatPercent: number;
  fatGPerKg: number;
  carbsPercent: number;
  manualTargetKcal: number | null;
  leanMassKg: number | null;
  mealDistributionMode: MealDistributionMode;
  mealDistribution: MealDistributionItem[];
};

export type DraftPatient = {
  id: string;
  name: string;
  email: string;
  planLabel: string;
  clinicalStatus?: PatientClinicalStatus;
  /** Observações internas da nutricionista (texto livre). */
  clinicalNotes?: string;
  /** ISO 8601 — última atualização local do cadastro. */
  updatedAt?: string;
  /** ISO 8601 — criação no servidor (Supabase). */
  createdAt?: string;
  /** Telefone / WhatsApp. */
  phone?: string;
  /** Data de nascimento (YYYY-MM-DD). */
  birthDate?: string | null;
  sex?: PatientSex | null;
  weightKg?: number | null;
  heightCm?: number | null;
  activityLevel?: NutritionActivityLevel | null;
  nutritionGoal?: NutritionGoal | null;
  /** Acesso ao app do paciente. */
  portalAccessActive?: boolean;
  portalCanDietPlan?: boolean;
  portalCanRecipes?: boolean;
  portalCanMaterials?: boolean;
  portalCanShopping?: boolean;
};

/** Unidade principal da porção (quantidade + unidade). */
export type PlanFoodUnit = "g" | "ml" | "unidade" | "porção";

/** Opção de alimento dentro de um grupo (ex.: uma das proteínas possíveis). */
export type DraftPlanFoodOption = {
  id: string;
  name: string;
  quantity: number;
  unit: PlanFoodUnit;
  /** Medida caseira opcional (ex.: 1 colher de sopa, 1 fatia). */
  householdMeasure: string;
  /** Gramas equivalentes opcionais (0 = não informado). */
  grams: number;
  /** ml equivalentes opcionais (0 = não informado). */
  ml: number;
  note: string;
  /** Receita / modo de preparo opcional. */
  recipe: string;
  /** URL da imagem (futuro: upload); vazio se não houver. */
  imageUrl: string;
  /** Vínculo opcional com `public.foods` (base de alimentos). */
  foodId?: string | null;
  /** Snapshot dos macros do alimento na base, por 100 g (escala com porção). */
  foodCaloriesPer100?: number;
  foodProteinPer100?: number;
  foodCarbsPer100?: number;
  foodFatPer100?: number;
};

/** Grupo dentro da refeição (bebida, proteína, etc.) com várias opções equivalentes. */
export type DraftPlanFoodGroup = {
  id: string;
  name: string;
  options: DraftPlanFoodOption[];
};

/** Refeição com horário, observação e grupos. */
export type DraftPlanMeal = {
  id: string;
  name: string;
  /** Horário sugerido (formato HH:mm). */
  time: string;
  /** Observações da refeição (orientações clínicas, substituições, etc.). */
  observation: string;
  groups: DraftPlanFoodGroup[];
};

export type PlanKind = "template" | "patient_plan";

/** Snapshot de uma versão salva (base para histórico e futura restauração). */
export type DraftPlanRevisionSnapshot = {
  id: string;
  savedAt: string;
  versionNumber: number;
  name: string;
  description: string;
  status: "draft" | "published";
  planKind: PlanKind;
  linkedPatientId: string | null;
  meals: DraftPlanMeal[];
  /** Rótulo exibido (ex.: e-mail do profissional). Em produção: nome ou ID do usuário. */
  changedByLabel?: string;
  /** Futuro: `auth.users.id` / `profiles.id` do Supabase. */
  changedByUserId?: string | null;
};

export type DraftPlan = {
  id: string;
  name: string;
  description: string;
  status: "draft" | "published";
  /**
   * @deprecated Preferir planKind + linkedPatientId. Mantido para compatibilidade e listagens.
   */
  patientCount: number;
  /** Plano modelo (biblioteca) ou atribuído a um paciente. */
  planKind: PlanKind;
  /** ID do paciente em `DraftPatient` quando `patient_plan`. */
  linkedPatientId: string | null;
  /** Nome do profissional (cabeçalho PDF / documento). */
  professionalName: string;
  /** Registro profissional opcional (ex.: CRN). */
  professionalRegistration: string;
  /** Nome exibido no cabeçalho quando não há paciente vinculado ou para sobrescrever rótulo. */
  patientHeaderLabel: string;
  meals: DraftPlanMeal[];
  /** Histórico de versões salvas (metadados + refeições naquele momento). */
  revisionHistory: DraftPlanRevisionSnapshot[];
  /** Número monotônico da versão atual (incrementa a cada salvamento persistido). */
  currentVersionNumber: number;
  /** Data/hora da última publicação no Supabase (só preenchido ao carregar da API). */
  publishedAt?: string | null;
  /**
   * Refeições (e metadados do snapshot) visíveis ao paciente enquanto a nutricionista edita rascunho.
   * Preenchido a partir de `published_structure_json` quando status = published.
   */
  portalMeals?: DraftPlanMeal[] | null;
  nutritionProfile?: PlanNutritionProfile;
};

const UNITS: PlanFoodUnit[] = ["g", "ml", "unidade", "porção"];

export function isPlanFoodUnit(u: string): u is PlanFoodUnit {
  return UNITS.includes(u as PlanFoodUnit);
}

export function createEmptyFoodOption(): DraftPlanFoodOption {
  return {
    id: crypto.randomUUID(),
    name: "",
    quantity: 0,
    unit: "g",
    householdMeasure: "",
    grams: 0,
    ml: 0,
    note: "",
    recipe: "",
    imageUrl: "",
    foodId: null,
  };
}

export function createEmptyFoodGroup(name = "Novo grupo"): DraftPlanFoodGroup {
  return {
    id: crypto.randomUUID(),
    name,
    options: [createEmptyFoodOption()],
  };
}

const DEFAULT_MEAL_TIMES = ["07:30", "12:30", "15:30", "19:30", "21:00"];

export function createEmptyMeal(name = "Nova refeição", index = 0): DraftPlanMeal {
  return {
    id: crypto.randomUUID(),
    name,
    time: DEFAULT_MEAL_TIMES[index % DEFAULT_MEAL_TIMES.length] ?? "08:00",
    observation: "",
    groups: [createEmptyFoodGroup("Bebida"), createEmptyFoodGroup("Proteína")],
  };
}

/** Normaliza paciente salvo (inclui registros legados sem novos campos). */
function parseSex(raw: unknown): PatientSex | null | undefined {
  if (raw === null || raw === undefined || raw === "") return raw === null ? null : undefined;
  const s = String(raw);
  if (s === "female" || s === "male" || s === "other" || s === "unspecified") return s;
  return undefined;
}

function parseActivity(raw: unknown): NutritionActivityLevel | null | undefined {
  if (raw === null || raw === undefined || raw === "") return raw === null ? null : undefined;
  const s = String(raw);
  if (s === "sedentary" || s === "light" || s === "moderate" || s === "intense") return s;
  return undefined;
}

function parseGoal(raw: unknown): NutritionGoal | null | undefined {
  if (raw === null || raw === undefined || raw === "") return raw === null ? null : undefined;
  const s = String(raw);
  if (s === "weight_loss" || s === "maintenance" || s === "muscle_gain") return s;
  return undefined;
}

export function normalizeDraftPatient(raw: unknown): DraftPatient {
  if (!raw || typeof raw !== "object") {
    return {
      id: crypto.randomUUID(),
      name: "",
      email: "",
      planLabel: "—",
      clinicalStatus: "active",
      clinicalNotes: "",
      phone: "",
      birthDate: null,
      sex: null,
      portalAccessActive: true,
      portalCanDietPlan: true,
      portalCanRecipes: true,
      portalCanMaterials: true,
      portalCanShopping: true,
    };
  }
  const o = raw as Record<string, unknown>;
  const status = o.clinicalStatus ?? o.status;
  const clinicalStatus: PatientClinicalStatus =
    status === "paused" || status === "archived" || status === "active" ? status : "active";
  const sex = parseSex(o.sex);
  const activityLevel = parseActivity(o.activityLevel);
  const nutritionGoal = parseGoal(o.nutritionGoal);
  const toNum = (v: unknown): number | null | undefined => {
    if (v === null || v === undefined || v === "") return v === null ? null : undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    id: typeof o.id === "string" ? o.id : crypto.randomUUID(),
    name: typeof o.name === "string" ? o.name : "",
    email: typeof o.email === "string" ? o.email : "",
    planLabel: typeof o.planLabel === "string" && o.planLabel.trim() ? o.planLabel : "—",
    clinicalStatus,
    clinicalNotes: typeof o.clinicalNotes === "string" ? o.clinicalNotes : "",
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : undefined,
    phone: typeof o.phone === "string" ? o.phone : "",
    birthDate: typeof o.birthDate === "string" ? o.birthDate : null,
    sex: sex === undefined ? null : sex,
    weightKg: toNum(o.weightKg) ?? null,
    heightCm: toNum(o.heightCm) ?? null,
    activityLevel: activityLevel === undefined ? null : activityLevel,
    nutritionGoal: nutritionGoal === undefined ? null : nutritionGoal,
    portalAccessActive: typeof o.portalAccessActive === "boolean" ? o.portalAccessActive : true,
    portalCanDietPlan: typeof o.portalCanDietPlan === "boolean" ? o.portalCanDietPlan : true,
    portalCanRecipes: typeof o.portalCanRecipes === "boolean" ? o.portalCanRecipes : true,
    portalCanMaterials: typeof o.portalCanMaterials === "boolean" ? o.portalCanMaterials : true,
    portalCanShopping: typeof o.portalCanShopping === "boolean" ? o.portalCanShopping : true,
  };
}

function normalizeNutritionProfile(raw: unknown): PlanNutritionProfile {
  const base: PlanNutritionProfile = {
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
  };
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const sex = parseSex(o.sex);
  const activity = parseActivity(o.activityLevel);
  const goal = parseGoal(o.goal);
  const numOrNull = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const formulaRaw = o.formula;
  const formula: MetabolicFormula =
    formulaRaw === "harris_benedict" || formulaRaw === "henry_rees" || formulaRaw === "cunningham"
      ? formulaRaw
      : "mifflin_st_jeor";
  const macroModeRaw = o.macroMode;
  const macroMode: MacroSplitMode = macroModeRaw === "percent" ? "percent" : "hybrid";
  const mealDistributionMode = o.mealDistributionMode === "manual" ? "manual" : "auto";
  const mealDistribution = Array.isArray(o.mealDistribution)
    ? o.mealDistribution
        .map((x) => {
          if (!x || typeof x !== "object") return null;
          const i = x as Record<string, unknown>;
          const mealId = typeof i.mealId === "string" ? i.mealId.trim() : "";
          const percent = Number(i.percent);
          if (!mealId || !Number.isFinite(percent)) return null;
          return { mealId, percent };
        })
        .filter(Boolean) as MealDistributionItem[]
    : [];
  return {
    sex: sex === undefined ? null : sex,
    ageYears: numOrNull(o.ageYears),
    weightKg: numOrNull(o.weightKg),
    heightCm: numOrNull(o.heightCm),
    activityLevel: activity === undefined ? null : activity,
    goal: goal === undefined ? "maintenance" : goal,
    formula,
    adjustmentPercent: numOrNull(o.adjustmentPercent) ?? 0,
    macroMode,
    proteinGPerKg: numOrNull(o.proteinGPerKg) ?? 1.6,
    fatPercent: numOrNull(o.fatPercent) ?? 30,
    fatGPerKg: numOrNull(o.fatGPerKg) ?? 0.8,
    carbsPercent: numOrNull(o.carbsPercent) ?? 45,
    manualTargetKcal: numOrNull(o.manualTargetKcal),
    leanMassKg: numOrNull(o.leanMassKg),
    mealDistributionMode,
    mealDistribution,
  };
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Migra item legado (lista plana) para opção completa. */
function legacyItemToOption(raw: unknown): DraftPlanFoodOption {
  if (!raw || typeof raw !== "object") return createEmptyFoodOption();
  const o = raw as Record<string, unknown>;
  const qty = Number(o.quantity);
  const unitStr = typeof o.unit === "string" ? o.unit : "g";
  const foodIdRaw = o.foodId;
  const foodId =
    typeof foodIdRaw === "string" && foodIdRaw.trim() ? foodIdRaw.trim() : foodIdRaw === null ? null : undefined;

  const numOrUndef = (v: unknown): number | undefined => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const opt: DraftPlanFoodOption = {
    id: typeof o.id === "string" ? o.id : crypto.randomUUID(),
    name: typeof o.name === "string" ? o.name : "",
    quantity: Number.isFinite(qty) ? qty : 0,
    unit: isPlanFoodUnit(unitStr) ? unitStr : "g",
    householdMeasure: typeof o.householdMeasure === "string" ? o.householdMeasure : "",
    grams: Number.isFinite(Number(o.grams)) ? Math.max(0, Number(o.grams)) : 0,
    ml: Number.isFinite(Number(o.ml)) ? Math.max(0, Number(o.ml)) : 0,
    note: typeof o.note === "string" ? o.note : "",
    recipe: typeof o.recipe === "string" ? o.recipe : "",
    imageUrl: typeof o.imageUrl === "string" ? o.imageUrl : "",
  };

  if (foodId !== undefined) opt.foodId = foodId;
  const c = numOrUndef(o.foodCaloriesPer100);
  const p = numOrUndef(o.foodProteinPer100);
  const cb = numOrUndef(o.foodCarbsPer100);
  const f = numOrUndef(o.foodFatPer100);
  if (c !== undefined) opt.foodCaloriesPer100 = c;
  if (p !== undefined) opt.foodProteinPer100 = p;
  if (cb !== undefined) opt.foodCarbsPer100 = cb;
  if (f !== undefined) opt.foodFatPer100 = f;

  return opt;
}

function normalizeFoodOption(raw: unknown): DraftPlanFoodOption {
  const opt = legacyItemToOption(raw);
  return opt;
}

function normalizeGroup(raw: unknown): DraftPlanFoodGroup {
  if (!raw || typeof raw !== "object") return createEmptyFoodGroup();
  const o = raw as Record<string, unknown>;
  const optsRaw = o.options;
  const options = Array.isArray(optsRaw) ? optsRaw.map(normalizeFoodOption) : [];
  return {
    id: typeof o.id === "string" ? o.id : crypto.randomUUID(),
    name: typeof o.name === "string" && o.name.trim() ? o.name : "Grupo",
    options: options.length ? options : [createEmptyFoodOption()],
  };
}

function migrateLegacyMeal(o: Record<string, unknown>): DraftPlanMeal {
  const itemsRaw = o.items;
  const groupsRaw = o.groups;
  const name = typeof o.name === "string" && o.name.trim() ? o.name : "Refeição";
  const time = typeof o.time === "string" && o.time.trim() ? o.time : "08:00";
  const observation = typeof o.observation === "string" ? o.observation : "";

  if (Array.isArray(groupsRaw) && groupsRaw.length) {
    return {
      id: typeof o.id === "string" ? o.id : crypto.randomUUID(),
      name,
      time,
      observation,
      groups: groupsRaw.map(normalizeGroup),
    };
  }

  if (Array.isArray(itemsRaw) && itemsRaw.length) {
    const options = itemsRaw.map(legacyItemToOption);
    return {
      id: typeof o.id === "string" ? o.id : crypto.randomUUID(),
      name,
      time,
      observation,
      groups: [
        {
          id: crypto.randomUUID(),
          name: "Alimentos",
          options: options.length ? options : [createEmptyFoodOption()],
        },
      ],
    };
  }

  return {
    id: typeof o.id === "string" ? o.id : crypto.randomUUID(),
    name,
    time,
    observation,
    groups: [createEmptyFoodGroup("Grupo alimentar")],
  };
}

function normalizeMeal(raw: unknown, index: number): DraftPlanMeal {
  if (!raw || typeof raw !== "object") return createEmptyMeal("Refeição", index);
  return migrateLegacyMeal(raw as Record<string, unknown>);
}

function normalizeRevision(raw: unknown): DraftPlanRevisionSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const mealsRaw = o.meals;
  if (!Array.isArray(mealsRaw)) return null;
  const vn = Number(o.versionNumber);
  return {
    id: typeof o.id === "string" ? o.id : crypto.randomUUID(),
    savedAt: typeof o.savedAt === "string" ? o.savedAt : new Date().toISOString(),
    versionNumber: Number.isFinite(vn) ? Math.max(1, Math.floor(vn)) : 1,
    name: typeof o.name === "string" ? o.name : "",
    description: typeof o.description === "string" ? o.description : "",
    status: o.status === "published" ? "published" : "draft",
    planKind: o.planKind === "patient_plan" ? "patient_plan" : "template",
    linkedPatientId: typeof o.linkedPatientId === "string" ? o.linkedPatientId : null,
    meals: mealsRaw.map((m, i) => normalizeMeal(m, i)),
    changedByLabel: typeof o.changedByLabel === "string" ? o.changedByLabel : undefined,
    changedByUserId: typeof o.changedByUserId === "string" ? o.changedByUserId : undefined,
  };
}

/** Aceita planos antigos (refeições com `items` em lista plana) e normaliza. */
export function normalizePlan(raw: unknown): DraftPlan {
  if (!raw || typeof raw !== "object") {
    return {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      status: "draft",
      patientCount: 0,
      planKind: "template",
      linkedPatientId: null,
      professionalName: "",
      professionalRegistration: "",
      patientHeaderLabel: "",
      meals: [createEmptyMeal("Café da manhã", 0)],
      revisionHistory: [],
      currentVersionNumber: 1,
      nutritionProfile: normalizeNutritionProfile(null),
    };
  }
  const o = raw as Record<string, unknown>;
  const mealsRaw = o.meals;
  const meals = Array.isArray(mealsRaw) ? mealsRaw.map((m, i) => normalizeMeal(m, i)) : [];
  const pc = Number(o.patientCount);
  const revRaw = o.revisionHistory;
  const revisions = Array.isArray(revRaw) ? revRaw.map(normalizeRevision).filter(Boolean) as DraftPlanRevisionSnapshot[] : [];
  const cv = Number(o.currentVersionNumber);

  const planKind: PlanKind = o.planKind === "patient_plan" ? "patient_plan" : "template";
  const linked =
    typeof o.linkedPatientId === "string" && o.linkedPatientId.trim() ? o.linkedPatientId.trim() : null;

  return {
    id: typeof o.id === "string" ? o.id : crypto.randomUUID(),
    name: typeof o.name === "string" ? o.name : "",
    description: typeof o.description === "string" ? o.description : "",
    status: o.status === "published" ? "published" : "draft",
    patientCount: Number.isFinite(pc) ? Math.max(0, Math.floor(pc)) : linked ? 1 : 0,
    planKind: linked ? "patient_plan" : planKind,
    linkedPatientId: linked,
    professionalName: typeof o.professionalName === "string" ? o.professionalName : "",
    professionalRegistration: typeof o.professionalRegistration === "string" ? o.professionalRegistration : "",
    patientHeaderLabel: typeof o.patientHeaderLabel === "string" ? o.patientHeaderLabel : "",
    meals: meals.length ? meals : [createEmptyMeal("Café da manhã", 0)],
    revisionHistory: revisions.slice(-20),
    currentVersionNumber: Number.isFinite(cv) ? Math.max(1, Math.floor(cv)) : 1,
    ...(typeof o.publishedAt === "string" || o.publishedAt === null
      ? { publishedAt: o.publishedAt === null ? null : (o.publishedAt as string) }
      : {}),
    ...(Array.isArray(o.portalMeals) ? { portalMeals: o.portalMeals.map((m, i) => normalizeMeal(m, i)) } : {}),
    nutritionProfile: normalizeNutritionProfile(o.nutritionProfile),
  };
}

export type SnapshotAuthor = {
  changedByLabel?: string;
  changedByUserId?: string | null;
};

/** Cria entrada de histórico a partir do plano atual (antes de incrementar versão no salvamento). */
export function snapshotPlanForHistory(
  plan: DraftPlan,
  versionNumber: number,
  author?: SnapshotAuthor,
): DraftPlanRevisionSnapshot {
  const mealsClone = JSON.parse(JSON.stringify(plan.meals)) as DraftPlanMeal[];
  return {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    versionNumber,
    name: plan.name,
    description: plan.description,
    status: plan.status,
    planKind: plan.planKind,
    linkedPatientId: plan.linkedPatientId,
    meals: mealsClone,
    changedByLabel: author?.changedByLabel,
    changedByUserId: author?.changedByUserId ?? null,
  };
}

