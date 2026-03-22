"use client";

import * as React from "react";
import { DietPlanBuilder } from "@/components/diet-plan-builder/diet-plan-builder";

export default function NewDietPlanPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-body14 font-semibold text-text-muted">
          Abrindo construtor…
        </div>
      }
    >
      <DietPlanBuilder mode="new" />
    </React.Suspense>
  );
}
