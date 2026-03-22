import type { DraftPlan, DraftPlanFoodOption, DraftPlanMeal, PlanFoodUnit } from "@/lib/draft-storage";

export type MacroTotals = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Gramas equivalentes para escalar macros (tabela foods = por 100 g). */
export function effectiveGramsForNutrition(option: DraftPlanFoodOption): number | null {
  const u = option.unit as PlanFoodUnit;
  if (u === "g") {
    const q = option.quantity;
    return Number.isFinite(q) && q > 0 ? q : null;
  }
  if (u === "ml") {
    const m = option.ml > 0 ? option.ml : option.quantity;
    return Number.isFinite(m) && m > 0 ? m : null;
  }
  if (u === "unidade" || u === "porção") {
    const g = option.grams;
    return Number.isFinite(g) && g > 0 ? g : null;
  }
  return null;
}

function hasMacroSnapshot(option: DraftPlanFoodOption): boolean {
  return (
    Boolean(option.foodId) &&
    typeof option.foodCaloriesPer100 === "number" &&
    typeof option.foodProteinPer100 === "number" &&
    typeof option.foodCarbsPer100 === "number" &&
    typeof option.foodFatPer100 === "number"
  );
}

/** Calcula kcal e macronutrientes da linha a partir do snapshot por 100 g e da porção. */
export function computeOptionNutrition(option: DraftPlanFoodOption): MacroTotals | null {
  if (!hasMacroSnapshot(option)) return null;
  const grams = effectiveGramsForNutrition(option);
  if (grams == null || grams <= 0) return null;
  const factor = grams / 100;
  return {
    kcal: round1(option.foodCaloriesPer100! * factor),
    protein: round1(option.foodProteinPer100! * factor),
    carbs: round1(option.foodCarbsPer100! * factor),
    fat: round1(option.foodFatPer100! * factor),
  };
}

export function emptyTotals(): MacroTotals {
  return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
}

export function addTotals(a: MacroTotals, b: MacroTotals): MacroTotals {
  return {
    kcal: round1(a.kcal + b.kcal),
    protein: round1(a.protein + b.protein),
    carbs: round1(a.carbs + b.carbs),
    fat: round1(a.fat + b.fat),
  };
}

/**
 * Soma todas as opções da refeição (todas as linhas de todos os grupos).
 * Grupos com alternativas podem superestimar — ver texto de ajuda na UI.
 */
export function sumMealNutrition(meal: DraftPlanMeal): MacroTotals {
  let acc = emptyTotals();
  for (const g of meal.groups) {
    for (const o of g.options) {
      const line = computeOptionNutrition(o);
      if (line) acc = addTotals(acc, line);
    }
  }
  return acc;
}

export function sumPlanDayNutrition(plan: DraftPlan): MacroTotals {
  let acc = emptyTotals();
  for (const m of plan.meals) {
    acc = addTotals(acc, sumMealNutrition(m));
  }
  return acc;
}

export function formatMacroTotals(t: MacroTotals): string {
  return `${Math.round(t.kcal)} kcal · P ${t.protein}g · C ${t.carbs}g · G ${t.fat}g`;
}
