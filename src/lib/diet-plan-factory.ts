import type { DraftPlan, DraftPlanMeal } from "@/lib/draft-storage";
import { createEmptyFoodItem, createEmptyMeal } from "@/lib/draft-storage";

/** Estado inicial para um plano novo no construtor (nomes típicos, sem alimentos preenchidos). */
export function createNewPlanSkeleton(): DraftPlan {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    status: "draft",
    patientCount: 0,
    meals: [createEmptyMeal("Café da manhã"), createEmptyMeal("Almoço"), createEmptyMeal("Lanche"), createEmptyMeal("Jantar")],
  };
}

function newIdsForMeal(meal: DraftPlanMeal): DraftPlanMeal {
  return {
    id: crypto.randomUUID(),
    name: `${meal.name} (cópia)`,
    items: meal.items.map((f) => ({ ...f, id: crypto.randomUUID() })),
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
  return next.length ? next : [createEmptyMeal("Refeição")];
}

export function addFoodToMeal(meals: DraftPlanMeal[], mealId: string): DraftPlanMeal[] {
  return meals.map((m) => (m.id === mealId ? { ...m, items: [...m.items, createEmptyFoodItem()] } : m));
}

export function removeFoodFromMeal(meals: DraftPlanMeal[], mealId: string, foodId: string): DraftPlanMeal[] {
  return meals.map((m) => {
    if (m.id !== mealId) return m;
    const items = m.items.filter((f) => f.id !== foodId);
    return { ...m, items: items.length ? items : [createEmptyFoodItem()] };
  });
}

export { isPlanFoodUnit } from "@/lib/draft-storage";
