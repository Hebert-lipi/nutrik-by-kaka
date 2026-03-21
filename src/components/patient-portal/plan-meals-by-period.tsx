"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import type { DraftPlanMeal } from "@/lib/draft-storage";
import { groupMealsByPeriod, MEAL_PERIOD_ORDER, mealPeriodLabel } from "@/lib/clinical/meal-period";
import type { MealDifficulty } from "@/lib/patient-adherence-storage";
import {
  getAdherenceDay,
  getTodayDateKey,
  patchMealAdherence,
  setDailyNote,
} from "@/lib/patient-adherence-storage";

function formatOptionLine(meal: DraftPlanMeal) {
  return meal.groups.flatMap((g) =>
    g.options.map((opt) => {
      const qty =
        opt.quantity > 0
          ? `${opt.quantity} ${opt.unit}${opt.householdMeasure ? ` (${opt.householdMeasure})` : ""}`
          : opt.householdMeasure || opt.unit;
      return { group: g.name, line: opt.name, qty, note: opt.note, recipe: opt.recipe };
    }),
  );
}

const DIFFICULTY_LABEL: Record<MealDifficulty, string> = {
  none: "Não informado",
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

export function PlanMealsByPeriod({
  meals,
  planName,
  subtitle,
  lastUpdatedIso,
  className,
  headerBadge,
  adherence,
}: {
  meals: DraftPlanMeal[];
  planName: string;
  subtitle?: string;
  lastUpdatedIso?: string | null;
  className?: string;
  headerBadge?: React.ReactNode;
  /** Quando definido, habilita registro local de adesão (espelha futura API). */
  adherence?: { patientId: string; planId: string };
}) {
  const grouped = React.useMemo(() => groupMealsByPeriod(meals), [meals]);
  const dateKey = React.useMemo(() => getTodayDateKey(), []);
  const [dayTick, setDayTick] = React.useState(0);

  const reloadDay = React.useCallback(() => setDayTick((t) => t + 1), []);

  React.useEffect(() => {
    const on = () => reloadDay();
    window.addEventListener("nutrik-patient-adherence", on);
    return () => window.removeEventListener("nutrik-patient-adherence", on);
  }, [reloadDay]);

  const dayLog =
    adherence && dayTick >= 0
      ? getAdherenceDay(adherence.patientId, adherence.planId, dateKey)
      : null;

  const formattedDate = lastUpdatedIso
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(lastUpdatedIso))
    : null;

  return (
    <div className={cn("space-y-8", className)}>
      <div className="text-center sm:text-left">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <p className="text-small12 font-bold uppercase tracking-[0.14em] text-secondary">{subtitle ?? "Plano alimentar"}</p>
            <h1 className="mt-1 text-[1.65rem] font-extrabold leading-tight tracking-tight text-text-primary sm:text-3xl">{planName}</h1>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {headerBadge}
            {formattedDate ? (
              <Chip tone="muted" className="font-bold">
                Atualizado em {formattedDate}
              </Chip>
            ) : null}
          </div>
        </div>
        <p className="mx-auto mt-3 max-w-2xl text-body14 leading-relaxed text-text-secondary sm:mx-0">
          Organizamos suas refeições por período do dia. Siga as quantidades e observações indicadas pela sua nutricionista.
        </p>
      </div>

      {meals.length === 0 ? (
        <Card className="border-dashed border-neutral-200/80 bg-bg-0/80">
          <CardContent className="py-14 text-center text-body14 text-text-secondary">
            Nenhuma refeição cadastrada neste plano ainda.
          </CardContent>
        </Card>
      ) : (
        MEAL_PERIOD_ORDER.map((period) => {
          const list = grouped.get(period);
          if (!list?.length) return null;
          return (
            <section key={period} className="space-y-4">
              <h2 className="text-title18 font-extrabold tracking-tight text-text-primary">{mealPeriodLabel(period)}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {list.map((meal) => (
                  <Card key={meal.id} className="overflow-hidden border-neutral-200/60 bg-bg-0 shadow-premium-sm">
                    <CardHeader className="border-b border-neutral-100/90 pb-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-extrabold text-text-primary">{meal.name}</p>
                          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">Horário sugerido · {meal.time}</p>
                        </div>
                      </div>
                      {meal.observation ? (
                        <p className="mt-2 text-body14 leading-relaxed text-text-secondary">{meal.observation}</p>
                      ) : null}
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                      {formatOptionLine(meal).map((row, idx) => (
                        <div
                          key={`${meal.id}-${idx}`}
                          className="rounded-xl border border-neutral-100/90 bg-neutral-50/40 px-3 py-2.5 text-small12"
                        >
                          <p className="font-bold text-text-primary">
                            <span className="text-text-muted">{row.group}: </span>
                            {row.line}
                          </p>
                          <p className="mt-1 font-semibold text-text-secondary">{row.qty}</p>
                          {row.note ? <p className="mt-2 text-[11px] leading-relaxed text-text-muted">{row.note}</p> : null}
                          {row.recipe ? (
                            <p className="mt-2 rounded-lg bg-bg-0 p-2 text-[11px] leading-relaxed text-text-secondary ring-1 ring-neutral-100/90">
                              <span className="font-extrabold text-text-primary">Preparo: </span>
                              {row.recipe}
                            </p>
                          ) : null}
                        </div>
                      ))}
                      {adherence && dayLog ? (
                        <div className="rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-3">
                          <p className="text-[11px] font-extrabold uppercase tracking-wide text-secondary">Seu registro hoje</p>
                          <label className="mt-2 flex cursor-pointer items-center gap-2 text-small12 font-semibold text-text-primary">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary/30"
                              checked={Boolean(dayLog.meals[meal.id]?.done)}
                              onChange={(e) => {
                                patchMealAdherence(adherence.patientId, adherence.planId, dateKey, meal.id, {
                                  done: e.target.checked,
                                });
                                reloadDay();
                              }}
                            />
                            Marquei esta refeição como realizada
                          </label>
                          <div className="mt-2">
                            <label className="text-[11px] font-bold text-text-muted" htmlFor={`diff-${meal.id}`}>
                              Dificuldade em seguir
                            </label>
                            <select
                              id={`diff-${meal.id}`}
                              className="mt-1 w-full rounded-xl border border-neutral-200/80 bg-bg-0 px-3 py-2 text-small12 font-semibold text-text-primary"
                              value={dayLog.meals[meal.id]?.difficulty ?? "none"}
                              onChange={(e) => {
                                patchMealAdherence(adherence.patientId, adherence.planId, dateKey, meal.id, {
                                  difficulty: e.target.value as MealDifficulty,
                                });
                                reloadDay();
                              }}
                            >
                              {(Object.keys(DIFFICULTY_LABEL) as MealDifficulty[]).map((k) => (
                                <option key={k} value={k}>
                                  {DIFFICULTY_LABEL[k]}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })
      )}

      {adherence && dayLog ? (
        <Card className="border-neutral-200/60 shadow-premium-sm">
          <CardHeader className="border-b border-neutral-100/90 pb-3">
            <p className="text-title16 font-extrabold text-text-primary">Observação do dia</p>
            <p className="mt-1 text-small12 text-text-secondary">
              Compartilhe como foi seu dia — sua nutricionista poderá ver isto quando conectarmos ao servidor.
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <textarea
              rows={4}
              className="w-full resize-y rounded-xl border border-neutral-200/90 bg-bg-0 px-4 py-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-neutral-400 focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
              placeholder="Ex.: senti fome no lanche, treino mais leve que o normal…"
              value={dayLog.dailyNote}
              onChange={(e) => {
                setDailyNote(adherence.patientId, adherence.planId, dateKey, e.target.value);
                reloadDay();
              }}
            />
            <p className="mt-2 text-[11px] font-semibold text-text-muted">
              Dados salvos neste aparelho ({dateKey}).
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
