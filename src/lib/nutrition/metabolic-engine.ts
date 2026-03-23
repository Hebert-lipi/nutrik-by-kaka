import type {
  MacroSplitMode,
  MetabolicFormula,
  NutritionActivityLevel,
  NutritionGoal,
  PatientSex,
  PlanNutritionProfile,
} from "@/lib/draft-storage";

export type EngineInput = PlanNutritionProfile;

export type MacroTargets = {
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
};

export type EngineResult = {
  formula: MetabolicFormula;
  tmb: number | null;
  pal: number | null;
  get: number | null;
  adjustmentPercent: number;
  targetKcal: number | null;
  macroTargets: MacroTargets | null;
  missing: string[];
};

const PAL_FACTOR: Record<NutritionActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  intense: 1.725,
};

function r1(v: number): number {
  return Math.round(v * 10) / 10;
}

function toYears(ageYears: number | null): number | null {
  if (ageYears == null) return null;
  return Number.isFinite(ageYears) && ageYears > 0 ? ageYears : null;
}

function tmbForFormula(input: EngineInput): number | null {
  const age = toYears(input.ageYears);
  const w = input.weightKg;
  const h = input.heightCm;
  const sex = input.sex;
  if (input.formula === "cunningham") {
    if (!Number.isFinite(Number(input.leanMassKg)) || Number(input.leanMassKg) <= 0) return null;
    return r1(500 + 22 * Number(input.leanMassKg));
  }
  if (!Number.isFinite(Number(w)) || !Number.isFinite(Number(age))) return null;
  if ((input.formula === "mifflin_st_jeor" || input.formula === "harris_benedict") && !Number.isFinite(Number(h))) return null;
  if (!sex || sex === "other" || sex === "unspecified") return null;

  if (input.formula === "mifflin_st_jeor") {
    const sexOffset = sex === "male" ? 5 : -161;
    return r1(10 * Number(w) + 6.25 * Number(h) - 5 * Number(age) + sexOffset);
  }
  if (input.formula === "harris_benedict") {
    if (sex === "male") return r1(88.362 + 13.397 * Number(w) + 4.799 * Number(h) - 5.677 * Number(age));
    return r1(447.593 + 9.247 * Number(w) + 3.098 * Number(h) - 4.33 * Number(age));
  }
  // Henry & Rees simplificado por sexo e idade adulta (aproximação clínica prática).
  if (sex === "male") return r1(11.4 * Number(w) + 541);
  return r1(10.8 * Number(w) + 565);
}

function normalizeAdjustment(goal: NutritionGoal | null, value: number): number {
  if (Number.isFinite(value)) return Math.max(-40, Math.min(40, value));
  if (goal === "weight_loss") return -15;
  if (goal === "muscle_gain") return 10;
  return 0;
}

function macroTargets(
  kcalTarget: number,
  mode: MacroSplitMode,
  proteinGPerKg: number,
  fatPercent: number,
  fatGPerKg: number,
  carbsPercent: number,
  weightKg: number,
): MacroTargets {
  const protein = mode === "percent" ? ((kcalTarget * Math.max(0, Math.min(100, 100 - fatPercent - carbsPercent))) / 100) / 4 : weightKg * proteinGPerKg;
  const fat = mode === "percent" ? ((kcalTarget * Math.max(0, fatPercent)) / 100) / 9 : weightKg * fatGPerKg;
  const kcalTaken = protein * 4 + fat * 9;
  const carbs = Math.max(0, (kcalTarget - kcalTaken) / 4);
  const totalKcal = Math.max(1, protein * 4 + carbs * 4 + fat * 9);
  return {
    proteinG: r1(protein),
    carbsG: r1(carbs),
    fatG: r1(fat),
    proteinPct: r1((protein * 4 * 100) / totalKcal),
    carbsPct: r1((carbs * 4 * 100) / totalKcal),
    fatPct: r1((fat * 9 * 100) / totalKcal),
  };
}

export function calculateNutritionEngine(input: EngineInput): EngineResult {
  const missing: string[] = [];
  if (!input.sex) missing.push("sexo");
  if (!input.ageYears) missing.push("idade");
  if (!input.weightKg) missing.push("peso");
  if ((input.formula === "mifflin_st_jeor" || input.formula === "harris_benedict") && !input.heightCm) missing.push("altura");
  if (!input.activityLevel) missing.push("atividade");
  const tmb = tmbForFormula(input);
  const pal = input.activityLevel ? PAL_FACTOR[input.activityLevel] : null;
  const get = tmb && pal ? r1(tmb * pal) : null;
  const adjustmentPercent = normalizeAdjustment(input.goal, input.adjustmentPercent);
  const targetSuggested = get ? r1(get * (1 + adjustmentPercent / 100)) : null;
  const targetKcal = input.manualTargetKcal && input.manualTargetKcal > 0 ? r1(input.manualTargetKcal) : targetSuggested;
  const macros =
    targetKcal && input.weightKg
      ? macroTargets(
          targetKcal,
          input.macroMode,
          Math.max(0.6, input.proteinGPerKg),
          Math.max(10, Math.min(60, input.fatPercent)),
          Math.max(0.3, input.fatGPerKg),
          Math.max(10, Math.min(70, input.carbsPercent)),
          input.weightKg,
        )
      : null;

  return {
    formula: input.formula,
    tmb,
    pal,
    get,
    adjustmentPercent,
    targetKcal,
    macroTargets: macros,
    missing,
  };
}

