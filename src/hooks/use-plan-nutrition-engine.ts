"use client";

import * as React from "react";
import type { DraftPatient, DraftPlan, PlanNutritionProfile } from "@/lib/draft-storage";
import { calculateNutritionEngine } from "@/lib/nutrition/metabolic-engine";
import { sumMealNutrition, sumPlanDayNutrition } from "@/lib/nutrition/food-math";
import { computeMealDistribution } from "@/lib/nutrition/meal-distribution";

function calcAgeYears(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age > 0 ? age : null;
}

export function profileFromPatient(patient: DraftPatient | null): PlanNutritionProfile {
  return {
    sex: patient?.sex ?? null,
    ageYears: calcAgeYears(patient?.birthDate),
    weightKg: patient?.weightKg ?? null,
    heightCm: patient?.heightCm ?? null,
    activityLevel: patient?.activityLevel ?? null,
    goal: patient?.nutritionGoal ?? "maintenance",
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
}

export function usePlanNutritionEngine(plan: DraftPlan) {
  const profile = plan.nutritionProfile ?? profileFromPatient(null);
  const prescribed = React.useMemo(() => sumPlanDayNutrition(plan), [plan]);
  const engine = React.useMemo(() => calculateNutritionEngine(profile), [profile]);
  const comparison = React.useMemo(() => {
    const target = engine.macroTargets;
    if (!target || !engine.targetKcal) return null;
    const pct = (actual: number, goal: number) => (goal > 0 ? Math.round((actual / goal) * 100) : 0);
    return {
      kcal: { target: engine.targetKcal, actual: prescribed.kcal, diff: Math.round(prescribed.kcal - engine.targetKcal), pct: pct(prescribed.kcal, engine.targetKcal) },
      protein: { target: target.proteinG, actual: prescribed.protein, diff: Math.round((prescribed.protein - target.proteinG) * 10) / 10, pct: pct(prescribed.protein, target.proteinG) },
      carbs: { target: target.carbsG, actual: prescribed.carbs, diff: Math.round((prescribed.carbs - target.carbsG) * 10) / 10, pct: pct(prescribed.carbs, target.carbsG) },
      fat: { target: target.fatG, actual: prescribed.fat, diff: Math.round((prescribed.fat - target.fatG) * 10) / 10, pct: pct(prescribed.fat, target.fatG) },
    };
  }, [engine, prescribed]);
  const mealBreakdown = React.useMemo(() => {
    if (!engine.targetKcal || !engine.macroTargets) return [];
    const dist = computeMealDistribution(plan.meals, profile, engine.targetKcal, engine.macroTargets);
    return plan.meals.map((meal) => {
      const prescribedMeal = sumMealNutrition(meal);
      const target = dist.items.find((x) => x.mealId === meal.id);
      if (!target) return null;
      const pct = (actual: number, goal: number) => (goal > 0 ? Math.round((actual / goal) * 100) : 0);
      return {
        mealId: meal.id,
        mealName: meal.name,
        percent: target.percent,
        target: target.targets,
        prescribed: prescribedMeal,
        comparison: {
          kcalPct: pct(prescribedMeal.kcal, target.targets.kcal),
          proteinPct: pct(prescribedMeal.protein, target.targets.protein),
          carbsPct: pct(prescribedMeal.carbs, target.targets.carbs),
          fatPct: pct(prescribedMeal.fat, target.targets.fat),
        },
      };
    }).filter(Boolean) as Array<{
      mealId: string;
      mealName: string;
      percent: number;
      target: { kcal: number; protein: number; carbs: number; fat: number };
      prescribed: { kcal: number; protein: number; carbs: number; fat: number };
      comparison: { kcalPct: number; proteinPct: number; carbsPct: number; fatPct: number };
    }>;
  }, [engine.targetKcal, engine.macroTargets, plan.meals, profile]);
  const distributionSummary = React.useMemo(
    () => computeMealDistribution(plan.meals, profile, engine.targetKcal ?? null, engine.macroTargets ?? null),
    [plan.meals, profile, engine.targetKcal, engine.macroTargets],
  );
  return { prescribed, engine, comparison, mealBreakdown, distributionSummary };
}

