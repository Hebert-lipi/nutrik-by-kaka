import type { DraftPlanMeal, PlanNutritionProfile } from "@/lib/draft-storage";
import type { MacroTargets } from "@/lib/nutrition/metabolic-engine";

type MealTargets = { kcal: number; protein: number; carbs: number; fat: number };
type Item = { mealId: string; mealName: string; percent: number; targets: MealTargets };

export type MealDistributionResult = {
  mode: "auto" | "manual";
  percentSum: number;
  validPercentSum: boolean;
  items: Item[];
};

function r1(v: number): number {
  return Math.round(v * 10) / 10;
}

function buildAutoPercent(meals: DraftPlanMeal[]): Array<{ mealId: string; percent: number }> {
  if (meals.length === 0) return [];
  const raw = 100 / meals.length;
  const base = meals.map((m) => ({ mealId: m.id, percent: r1(raw) }));
  const sum = base.reduce((acc, x) => acc + x.percent, 0);
  const diff = r1(100 - sum);
  if (base.length > 0) base[base.length - 1]!.percent = r1(base[base.length - 1]!.percent + diff);
  return base;
}

function mealTargets(percent: number, dailyKcal: number | null, macros: MacroTargets | null): MealTargets {
  const ratio = Math.max(0, percent) / 100;
  return {
    kcal: dailyKcal ? r1(dailyKcal * ratio) : 0,
    protein: macros ? r1(macros.proteinG * ratio) : 0,
    carbs: macros ? r1(macros.carbsG * ratio) : 0,
    fat: macros ? r1(macros.fatG * ratio) : 0,
  };
}

export function computeMealDistribution(
  meals: DraftPlanMeal[],
  profile: PlanNutritionProfile,
  dailyKcal: number | null,
  macros: MacroTargets | null,
): MealDistributionResult {
  const mode = profile.mealDistributionMode;
  const auto = buildAutoPercent(meals);
  const mapManual = new Map((profile.mealDistribution ?? []).map((x) => [x.mealId, x.percent]));
  const percents =
    mode === "manual"
      ? meals.map((m) => ({ mealId: m.id, percent: Number.isFinite(Number(mapManual.get(m.id))) ? Number(mapManual.get(m.id)) : 0 }))
      : auto;
  const sum = r1(percents.reduce((acc, x) => acc + x.percent, 0));
  const valid = Math.abs(sum - 100) <= 0.2 || meals.length === 0;
  return {
    mode,
    percentSum: sum,
    validPercentSum: valid,
    items: meals.map((meal) => {
      const percent = percents.find((x) => x.mealId === meal.id)?.percent ?? 0;
      return {
        mealId: meal.id,
        mealName: meal.name,
        percent,
        targets: mealTargets(percent, dailyKcal, macros),
      };
    }),
  };
}

