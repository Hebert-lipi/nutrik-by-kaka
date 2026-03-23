import type { DraftPatient, DraftPlan, DraftPlanFoodOption } from "@/lib/draft-storage";
import { sumMealNutrition } from "@/lib/nutrition/food-math";
import { buildShoppingListFromPlan as buildShoppingListFromClinical } from "@/lib/clinical/shopping-list";

export type PlanPdfVariant = "full" | "diet" | "shopping" | "recipes";

export type PlanPdfSectionFlags = {
  showPatientSummary: boolean;
  showDiet: boolean;
  showGeneralNotes: boolean;
  showShopping: boolean;
  showRecipes: boolean;
};

export type PlanPdfShoppingItem = {
  category: string;
  name: string;
  quantityLabel: string;
};

export type PlanPdfRecipe = {
  title: string;
  sourceMealName: string;
  ingredients: string[];
  preparation: string;
};

export function sectionFlagsForVariant(variant: PlanPdfVariant): PlanPdfSectionFlags {
  if (variant === "diet") {
    return {
      showPatientSummary: true,
      showDiet: true,
      showGeneralNotes: true,
      showShopping: false,
      showRecipes: false,
    };
  }
  if (variant === "shopping") {
    return {
      showPatientSummary: false,
      showDiet: false,
      showGeneralNotes: false,
      showShopping: true,
      showRecipes: false,
    };
  }
  if (variant === "recipes") {
    return {
      showPatientSummary: false,
      showDiet: false,
      showGeneralNotes: false,
      showShopping: false,
      showRecipes: true,
    };
  }
  return {
    showPatientSummary: true,
    showDiet: true,
    showGeneralNotes: true,
    showShopping: true,
    showRecipes: true,
  };
}

function ageFromBirthDate(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age > 0 ? age : null;
}

function qtyLabel(opt: DraftPlanFoodOption): string {
  if (opt.quantity > 0) return `${opt.quantity} ${opt.unit}`.trim();
  if (opt.householdMeasure.trim()) return opt.householdMeasure.trim();
  if (opt.grams > 0) return `${opt.grams} g`;
  if (opt.ml > 0) return `${opt.ml} ml`;
  return "porção orientada pela nutricionista";
}

export function buildShoppingListFromPlan(plan: DraftPlan): PlanPdfShoppingItem[] {
  return buildShoppingListFromClinical(plan);
}

export function buildRecipesFromPlan(plan: DraftPlan): PlanPdfRecipe[] {
  const out: PlanPdfRecipe[] = [];
  const seen = new Set<string>();
  for (const meal of plan.meals) {
    for (const group of meal.groups) {
      for (const opt of group.options) {
        const prep = opt.recipe.trim();
        if (!prep) continue;
        const title = opt.name.trim() || "Receita sem nome";
        const key = `${title.toLowerCase()}::${prep}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          title,
          sourceMealName: meal.name || "Refeição",
          ingredients: [`${title} — ${qtyLabel(opt)}`],
          preparation: prep,
        });
      }
    }
  }
  return out;
}

export function patientSummary(patient: DraftPatient | null, plan: DraftPlan): Array<{ label: string; value: string }> {
  if (!patient) {
    return [
      { label: "Paciente", value: plan.patientHeaderLabel.trim() || "Plano não vinculado a paciente" },
      { label: "Objetivo", value: "Não definido" },
    ];
  }
  const age = ageFromBirthDate(patient.birthDate);
  const validWeight = Number.isFinite(Number(patient.weightKg)) && Number(patient.weightKg) > 0 ? Number(patient.weightKg) : null;
  const validHeight = Number.isFinite(Number(patient.heightCm)) && Number(patient.heightCm) > 0 ? Number(patient.heightCm) : null;
  const imc = validWeight && validHeight ? (validWeight / Math.pow(validHeight / 100, 2)).toFixed(2) : null;
  return [
    { label: "Paciente", value: patient.name },
    { label: "Idade", value: age != null ? `${age} anos` : "Não informado" },
    { label: "Peso", value: validWeight != null ? `${validWeight} kg` : "Não informado" },
    { label: "Altura", value: validHeight != null ? `${validHeight} cm` : "Não informado" },
    { label: "Objetivo", value: patient.nutritionGoal === "weight_loss" ? "Emagrecimento" : patient.nutritionGoal === "muscle_gain" ? "Ganho de massa" : patient.nutritionGoal === "maintenance" ? "Manutenção" : "Não definido" },
    { label: "IMC", value: imc ?? "Não calculado" },
  ];
}

export function mealMacroSummary(plan: DraftPlan): Array<{ mealId: string; kcal: number; protein: number; carbs: number; fat: number }> {
  return plan.meals.map((m) => {
    const s = sumMealNutrition(m);
    return { mealId: m.id, kcal: Math.round(s.kcal), protein: s.protein, carbs: s.carbs, fat: s.fat };
  });
}

