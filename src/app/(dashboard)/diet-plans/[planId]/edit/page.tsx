"use client";

import { DietPlanBuilder } from "@/components/diet-plan-builder/diet-plan-builder";

export default function EditDietPlanPage({ params }: { params: { planId: string } }) {
  return <DietPlanBuilder mode="edit" planId={params.planId} />;
}
