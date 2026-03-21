import type { DraftPlanMeal } from "@/lib/draft-storage";

/** Períodos do dia para agrupar a experiência do paciente. */
export type MealPeriod =
  | "morning"
  | "afternoon"
  | "evening"
  | "supper"
  | "pre_workout"
  | "post_workout"
  | "other";

const PERIOD_LABEL: Record<MealPeriod, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  evening: "Noite",
  supper: "Ceia",
  pre_workout: "Pré-treino",
  post_workout: "Pós-treino",
  other: "Outras orientações",
};

export function mealPeriodLabel(period: MealPeriod): string {
  return PERIOD_LABEL[period];
}

/** Ordem de exibição na UI do paciente. */
export const MEAL_PERIOD_ORDER: MealPeriod[] = [
  "morning",
  "pre_workout",
  "afternoon",
  "post_workout",
  "evening",
  "supper",
  "other",
];

function parseHour(time: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!m) return null;
  const h = Number(m[1]);
  if (!Number.isFinite(h) || h < 0 || h > 23) return null;
  return h;
}

/** Infere período pelo nome da refeição e horário (sem campo extra no banco ainda). */
export function inferMealPeriod(meal: DraftPlanMeal): MealPeriod {
  const n = `${meal.name} ${meal.observation}`.toLowerCase();
  if (/pré[\s-]*treino|pre[\s-]*treino/.test(n)) return "pre_workout";
  if (/pós[\s-]*treino|pos[\s-]*treino/.test(n)) return "post_workout";
  if (/ceia/.test(n)) return "supper";
  const h = parseHour(meal.time);
  if (h !== null) {
    if (h < 11) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  }
  if (/café|manhã|desjejum/.test(n)) return "morning";
  if (/almoço|lanche/.test(n)) return "afternoon";
  if (/jantar|janta|noite/.test(n)) return "evening";
  return "other";
}

export function groupMealsByPeriod(meals: DraftPlanMeal[]): Map<MealPeriod, DraftPlanMeal[]> {
  const map = new Map<MealPeriod, DraftPlanMeal[]>();
  for (const m of meals) {
    const p = inferMealPeriod(m);
    const list = map.get(p) ?? [];
    list.push(m);
    map.set(p, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.time.localeCompare(b.time));
  }
  return map;
}
