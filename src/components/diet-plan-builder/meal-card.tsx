"use client";

import * as React from "react";
import type { DraftPlanFood, DraftPlanMeal, PlanFoodUnit } from "@/lib/draft-storage";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

const selectClass =
  "h-11 w-full rounded-xl border border-neutral-200/90 bg-bg-0 px-3 text-sm font-semibold text-text-primary shadow-sm outline-none transition-all focus:border-primary/30 focus:ring-2 focus:ring-primary/15";

const UNITS: { value: PlanFoodUnit; label: string }[] = [
  { value: "g", label: "g" },
  { value: "ml", label: "ml" },
  { value: "unidade", label: "unidade" },
];

function FoodRow({
  food,
  onChange,
  onRemove,
}: {
  food: DraftPlanFood;
  onChange: (patch: Partial<DraftPlanFood>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-3 border-b border-neutral-100/90 py-3 last:border-0 md:grid-cols-12 md:items-end md:gap-3">
      <div className="md:col-span-4">
        <Input
          label="Alimento"
          placeholder="Ex.: Filé de frango"
          value={food.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="space-y-1.5"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 md:col-span-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-small12 font-bold uppercase tracking-wide text-text-muted">Qtd.</label>
          <input
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            className="h-11 w-full rounded-xl border border-neutral-200/90 bg-bg-0 px-4 text-sm text-text-primary shadow-sm outline-none transition-all focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
            value={food.quantity === 0 ? "" : food.quantity}
            onChange={(e) => {
              const v = e.target.value;
              onChange({ quantity: v === "" ? 0 : Number(v) || 0 });
            }}
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-small12 font-bold uppercase tracking-wide text-text-muted">Unidade</label>
          <select
            className={selectClass}
            value={food.unit}
            onChange={(e) => onChange({ unit: e.target.value as PlanFoodUnit })}
          >
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="md:col-span-4">
        <Input
          label="Observação (opcional)"
          placeholder="Modo de preparo, troca, etc."
          value={food.note ?? ""}
          onChange={(e) => onChange({ note: e.target.value })}
          className="space-y-1.5"
        />
      </div>
      <div className="flex justify-end md:col-span-1 md:justify-center md:pb-0.5">
        <Button type="button" variant="ghost" size="sm" className="shrink-0 font-extrabold text-orange" onClick={onRemove}>
          Remover
        </Button>
      </div>
    </div>
  );
}

export function MealCard({
  meal,
  index,
  totalMeals,
  onMealNameChange,
  onRemoveMeal,
  onDuplicateMeal,
  onMoveMeal,
  onAddFood,
  onRemoveFood,
  onUpdateFood,
}: {
  meal: DraftPlanMeal;
  index: number;
  totalMeals: number;
  onMealNameChange: (name: string) => void;
  onRemoveMeal: () => void;
  onDuplicateMeal: () => void;
  onMoveMeal: (dir: -1 | 1) => void;
  onAddFood: () => void;
  onRemoveFood: (foodId: string) => void;
  onUpdateFood: (foodId: string, patch: Partial<DraftPlanFood>) => void;
}) {
  return (
    <Card className={cn("overflow-hidden border-neutral-200/55")}>
      <CardHeader className="border-b border-neutral-100/90 bg-gradient-to-r from-primary/[0.06] via-bg-0 to-yellow/[0.04] pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-small12 font-black text-primary ring-1 ring-primary/20">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <label className="block text-small12 font-bold uppercase tracking-wide text-text-muted">Nome da refeição</label>
              <input
                className="h-11 w-full max-w-md rounded-xl border border-neutral-200/90 bg-bg-0 px-4 text-sm font-bold text-text-primary shadow-sm outline-none transition-all focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
                value={meal.name}
                onChange={(e) => onMealNameChange(e.target.value)}
                placeholder="Ex.: Café da manhã"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => onMoveMeal(-1)} disabled={index === 0}>
              ↑
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onMoveMeal(1)} disabled={index >= totalMeals - 1}>
              ↓
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={onDuplicateMeal}>
              Duplicar
            </Button>
            <Button type="button" variant="ghost" size="sm" className="font-extrabold text-orange" onClick={onRemoveMeal}>
              Remover refeição
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 pt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-title14 font-extrabold text-text-primary">Alimentos</p>
            <Chip tone="muted">{meal.items.length} item(ns)</Chip>
          </div>
          <Button type="button" variant="primary" size="sm" onClick={onAddFood}>
            + Adicionar alimento
          </Button>
        </div>
        <div className="hidden border-b border-neutral-200/80 bg-neutral-50/50 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-text-muted md:grid md:grid-cols-12 md:gap-3">
          <span className="md:col-span-4">Alimento</span>
          <span className="md:col-span-3">Qtd. / Unid.</span>
          <span className="md:col-span-4">Observação</span>
          <span className="text-right md:col-span-1" />
        </div>
        <div className="px-0 md:px-2">
          {meal.items.map((f) => (
            <FoodRow
              key={f.id}
              food={f}
              onChange={(patch) => onUpdateFood(f.id, patch)}
              onRemove={() => onRemoveFood(f.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
