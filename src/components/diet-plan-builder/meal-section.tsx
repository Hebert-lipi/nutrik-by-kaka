"use client";

import * as React from "react";
import type { DraftPlanFoodGroup, DraftPlanFoodOption, DraftPlanMeal, PlanFoodUnit } from "@/lib/draft-storage";
import { createEmptyFoodGroup, createEmptyFoodOption } from "@/lib/draft-storage";
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
  { value: "porção", label: "porção" },
];

function OptionEditor({
  option,
  onChange,
  onRemove,
}: {
  option: DraftPlanFoodOption;
  onChange: (patch: Partial<DraftPlanFoodOption>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = React.useState(Boolean(option.recipe.trim() || option.imageUrl.trim()));

  return (
    <div className="rounded-xl border border-neutral-200/70 bg-bg-0 p-4 shadow-inner ring-1 ring-black/[0.02]">
      <div className="grid gap-3 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-3">
          <Input
            label="Alimento / opção"
            placeholder="Ex.: Filé de frango"
            value={option.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="space-y-1.5"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:col-span-5">
          <div className="space-y-1.5">
            <label className="block text-small12 font-bold uppercase tracking-wide text-text-muted">Qtd.</label>
            <input
              type="number"
              min={0}
              step="any"
              className="h-11 w-full rounded-xl border border-neutral-200/90 bg-bg-0 px-3 text-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
              value={option.quantity === 0 ? "" : option.quantity}
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
              value={option.unit}
              onChange={(e) => onChange({ unit: e.target.value as PlanFoodUnit })}
            >
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-small12 font-bold uppercase tracking-wide text-text-muted">g (opc.)</label>
            <input
              type="number"
              min={0}
              className="h-11 w-full rounded-xl border border-neutral-200/90 bg-bg-0 px-3 text-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
              value={option.grams === 0 ? "" : option.grams}
              onChange={(e) => {
                const v = e.target.value;
                onChange({ grams: v === "" ? 0 : Math.max(0, Number(v) || 0) });
              }}
              placeholder="—"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-small12 font-bold uppercase tracking-wide text-text-muted">ml (opc.)</label>
            <input
              type="number"
              min={0}
              className="h-11 w-full rounded-xl border border-neutral-200/90 bg-bg-0 px-3 text-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
              value={option.ml === 0 ? "" : option.ml}
              onChange={(e) => {
                const v = e.target.value;
                onChange({ ml: v === "" ? 0 : Math.max(0, Number(v) || 0) });
              }}
              placeholder="—"
            />
          </div>
        </div>
        <div className="lg:col-span-3">
          <Input
            label="Medida caseira (opc.)"
            placeholder="Ex.: 1 colher de sopa"
            value={option.householdMeasure}
            onChange={(e) => onChange({ householdMeasure: e.target.value })}
            className="space-y-1.5"
          />
        </div>
        <div className="flex justify-end lg:col-span-1 lg:items-end">
          <Button type="button" variant="ghost" size="sm" className="font-extrabold text-orange" onClick={onRemove}>
            Remover
          </Button>
        </div>
      </div>
      <div className="mt-3">
        <Input
          label="Observação (opcional)"
          placeholder="Substituições, marca, restrições…"
          value={option.note}
          onChange={(e) => onChange({ note: e.target.value })}
          className="space-y-1.5"
        />
      </div>
      <button
        type="button"
        className="mt-3 text-left text-[11px] font-extrabold uppercase tracking-wide text-primary hover:underline"
        onClick={() => setExpanded((x) => !x)}
      >
        {expanded ? "Ocultar receita e imagem" : "+ Receita / preparo e imagem"}
      </button>
      {expanded ? (
        <div className="mt-3 space-y-3 rounded-xl bg-neutral-50/60 p-3 ring-1 ring-neutral-200/60">
          <div className="space-y-2">
            <label className="block text-small12 font-bold uppercase tracking-wide text-text-muted">Receita / modo de preparo</label>
            <textarea
              rows={3}
              className="w-full resize-y rounded-xl border border-neutral-200/90 bg-bg-0 px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
              placeholder="Passo a passo, tempo de cozimento…"
              value={option.recipe}
              onChange={(e) => onChange({ recipe: e.target.value })}
            />
          </div>
          <Input
            label="URL da imagem (opcional)"
            placeholder="https://…"
            type="url"
            value={option.imageUrl}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
            className="space-y-1.5"
          />
          {option.imageUrl.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={option.imageUrl}
              alt=""
              className="mt-2 max-h-40 w-auto max-w-full rounded-lg border border-neutral-200 object-contain"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function GroupBlock({
  group,
  onChangeGroup,
  onRemoveGroup,
  onAddOption,
  onRemoveOption,
  onChangeOption,
}: {
  group: DraftPlanFoodGroup;
  onChangeGroup: (patch: Partial<DraftPlanFoodGroup>) => void;
  onRemoveGroup: () => void;
  onAddOption: () => void;
  onRemoveOption: (optionId: string) => void;
  onChangeOption: (optionId: string, patch: Partial<DraftPlanFoodOption>) => void;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-gradient-to-b from-neutral-50/40 to-bg-0 p-4 ring-1 ring-black/[0.02]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <label className="sr-only" htmlFor={`group-name-${group.id}`}>
            Nome do grupo
          </label>
          <input
            id={`group-name-${group.id}`}
            className="h-10 w-full max-w-xs rounded-xl border border-neutral-200/90 bg-bg-0 px-3 text-sm font-extrabold text-text-primary outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
            value={group.name}
            onChange={(e) => onChangeGroup({ name: e.target.value })}
            placeholder="Ex.: Proteína"
          />
          <Chip tone="primary">{group.options.length} opção(ões)</Chip>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="primary" size="sm" onClick={onAddOption}>
            + Opção
          </Button>
          <Button type="button" variant="ghost" size="sm" className="font-extrabold text-orange" onClick={onRemoveGroup}>
            Remover grupo
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        {group.options.map((opt) => (
          <OptionEditor
            key={opt.id}
            option={opt}
            onChange={(patch) => onChangeOption(opt.id, patch)}
            onRemove={() => onRemoveOption(opt.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function MealSection({
  meal,
  index,
  totalMeals,
  onMealChange,
  onDuplicateMeal,
  onRemoveMeal,
  onMoveMeal,
  onAddGroup,
  drag,
  dropHighlight,
  isDragging,
}: {
  meal: DraftPlanMeal;
  index: number;
  totalMeals: number;
  onMealChange: (next: DraftPlanMeal) => void;
  onDuplicateMeal: () => void;
  onRemoveMeal: () => void;
  onMoveMeal: (dir: -1 | 1) => void;
  onAddGroup: () => void;
  drag?: {
    onGripDragStart: (e: React.DragEvent) => void;
    onGripDragEnd: () => void;
  };
  dropHighlight?: boolean;
  isDragging?: boolean;
}) {
  const patchMeal = (patch: Partial<DraftPlanMeal>) => onMealChange({ ...meal, ...patch });

  const patchGroup = (groupId: string, patch: Partial<DraftPlanFoodGroup>) => {
    onMealChange({
      ...meal,
      groups: meal.groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)),
    });
  };

  const patchOption = (groupId: string, optionId: string, patch: Partial<DraftPlanFoodOption>) => {
    onMealChange({
      ...meal,
      groups: meal.groups.map((g) =>
        g.id !== groupId
          ? g
          : {
              ...g,
              options: g.options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)),
            },
      ),
    });
  };

  const removeGroup = (groupId: string) => {
    const groups = meal.groups.filter((g) => g.id !== groupId);
    patchMeal({ groups: groups.length ? groups : [createEmptyFoodGroup("Grupo alimentar")] });
  };

  const addOption = (groupId: string) => {
    onMealChange({
      ...meal,
      groups: meal.groups.map((g) =>
        g.id === groupId ? { ...g, options: [...g.options, createEmptyFoodOption()] } : g,
      ),
    });
  };

  const removeOption = (groupId: string, optionId: string) => {
    onMealChange({
      ...meal,
      groups: meal.groups.map((g) => {
        if (g.id !== groupId) return g;
        const options = g.options.filter((o) => o.id !== optionId);
        return { ...g, options: options.length ? options : [createEmptyFoodOption()] };
      }),
    });
  };

  return (
    <Card
      className={cn(
        "overflow-hidden border-neutral-200/55 transition-[opacity,box-shadow] duration-200",
        dropHighlight && "ring-2 ring-primary ring-offset-2 ring-offset-bg-1",
        isDragging && "opacity-55",
      )}
    >
      <CardHeader className="border-b border-neutral-100/90 bg-gradient-to-r from-primary/[0.06] via-bg-0 to-yellow/[0.04] pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-start">
            {drag ? (
              <div
                className="flex h-10 w-9 shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-xl border border-dashed border-neutral-300/90 bg-neutral-50/90 text-neutral-500 shadow-sm active:cursor-grabbing"
                draggable
                onDragStart={drag.onGripDragStart}
                onDragEnd={drag.onGripDragEnd}
                title="Arrastar para reordenar"
                aria-label="Arrastar para reordenar refeição"
              >
                <span className="pointer-events-none text-sm font-black leading-none tracking-tighter text-text-muted" aria-hidden>
                  ::
                </span>
              </div>
            ) : null}
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-small12 font-black text-primary ring-1 ring-primary/20">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-small12 font-bold uppercase tracking-wide text-text-muted">Nome da refeição</label>
                  <input
                    className="h-11 w-full rounded-xl border border-neutral-200/90 bg-bg-0 px-4 text-sm font-bold text-text-primary shadow-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
                    value={meal.name}
                    onChange={(e) => patchMeal({ name: e.target.value })}
                    placeholder="Ex.: Café da manhã"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-small12 font-bold uppercase tracking-wide text-text-muted">Horário</label>
                  <input
                    type="time"
                    className="h-11 w-full rounded-xl border border-neutral-200/90 bg-bg-0 px-4 text-sm font-bold text-text-primary shadow-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
                    value={meal.time}
                    onChange={(e) => patchMeal({ time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-small12 font-bold uppercase tracking-wide text-text-muted">Observações da refeição</label>
                <textarea
                  rows={2}
                  className="w-full resize-y rounded-xl border border-neutral-200/90 bg-bg-0 px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
                  placeholder="Orientações clínicas, substituições permitidas, observações de adesão…"
                  value={meal.observation}
                  onChange={(e) => patchMeal({ observation: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => onMoveMeal(-1)} disabled={index === 0}>
              ↑
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onMoveMeal(1)} disabled={index >= totalMeals - 1}>
              ↓
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={onDuplicateMeal}>
              Duplicar refeição
            </Button>
            <Button type="button" variant="ghost" size="sm" className="font-extrabold text-orange" onClick={onRemoveMeal}>
              Remover refeição
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <p className="text-title14 font-extrabold text-text-primary">Grupos de alimentos</p>
            <p className="mt-1 text-small12 font-semibold text-text-secondary">Ex.: bebida, proteína, carboidrato — com várias opções em cada.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="muted">{meal.groups.length} grupo(s)</Chip>
            <Button type="button" variant="primary" size="sm" onClick={onAddGroup}>
              + Adicionar grupo
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {meal.groups.map((group) => (
            <GroupBlock
              key={group.id}
              group={group}
              onChangeGroup={(patch) => patchGroup(group.id, patch)}
              onRemoveGroup={() => removeGroup(group.id)}
              onAddOption={() => addOption(group.id)}
              onRemoveOption={(oid) => removeOption(group.id, oid)}
              onChangeOption={(oid, patch) => patchOption(group.id, oid, patch)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
