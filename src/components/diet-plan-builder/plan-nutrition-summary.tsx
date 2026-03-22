"use client";

import * as React from "react";
import type { DraftPlan } from "@/lib/draft-storage";
import { sumPlanDayNutrition } from "@/lib/nutrition/food-math";
import { cn } from "@/lib/utils";

function MacroPill({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl border border-neutral-200/70 bg-bg-0/90 px-3 py-2 shadow-inner ring-1 ring-black/[0.02]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-0.5 text-title16 font-semibold tabular-nums text-text-primary">
        {value}
        <span className="ml-0.5 text-small12 font-bold text-text-secondary">{unit}</span>
      </p>
    </div>
  );
}

export function PlanNutritionSummary({ plan, className }: { plan: DraftPlan; className?: string }) {
  const day = React.useMemo(() => sumPlanDayNutrition(plan), [plan]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-bg-0 to-neutral-50/50 p-4 shadow-premium-sm ring-1 ring-primary/10 md:p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">Resumo do dia</p>
          <p className="mt-1 text-body14 font-semibold text-text-secondary">
            Soma das porções com alimento da base e peso (g/ml) informado. Grupos com várias opções somam todas as linhas.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-neutral-300/80 bg-neutral-50/50 px-4 py-3 text-center lg:min-w-[200px]">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Meta diária</p>
          <p className="mt-1 text-small12 font-bold text-text-secondary">Placeholder — personalização em breve</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MacroPill label="Energia" value={String(Math.round(day.kcal))} unit="kcal" />
        <MacroPill label="Proteína" value={String(day.protein)} unit="g" />
        <MacroPill label="Carboidrato" value={String(day.carbs)} unit="g" />
        <MacroPill label="Lipídios" value={String(day.fat)} unit="g" />
      </div>
    </div>
  );
}
