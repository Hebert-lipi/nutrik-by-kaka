"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DraftPlanMeal } from "@/lib/draft-storage";
import { groupMealsByPeriod, MEAL_PERIOD_ORDER, mealPeriodLabel } from "@/lib/clinical/meal-period";
import type { MealDifficulty } from "@/lib/supabase/patient-adherence-db";
import { usePatientAdherenceSupabase } from "@/hooks/use-patient-adherence-supabase";

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

function todayLogDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function PlanMealsByPeriod({
  meals,
  planName,
  subtitle,
  lastUpdatedIso,
  className,
  headerBadge,
  adherence,
  planUpdate,
}: {
  meals: DraftPlanMeal[];
  planName: string;
  subtitle?: string;
  lastUpdatedIso?: string | null;
  className?: string;
  headerBadge?: React.ReactNode;
  adherence?: { patientId: string; planId: string };
  /** Atualização do plano pela nutri + ação do paciente */
  planUpdate?: {
    pending: boolean;
    onRefresh: () => void;
    busy?: boolean;
  };
}) {
  const grouped = React.useMemo(() => groupMealsByPeriod(meals), [meals]);
  const logDate = React.useMemo(() => todayLogDate(), []);
  const enabled = Boolean(adherence?.patientId && adherence?.planId);

  const adh = usePatientAdherenceSupabase(adherence?.patientId, adherence?.planId, logDate, enabled);

  const completedCount = React.useMemo(() => {
    if (!enabled) return 0;
    return meals.filter((m) => Boolean(adh.mealState[m.id]?.completed)).length;
  }, [meals, adh.mealState, enabled]);

  const totalMeals = meals.length;
  const progressPct = totalMeals ? Math.round((completedCount / totalMeals) * 100) : 0;

  const [dailyDraft, setDailyDraft] = React.useState("");
  React.useEffect(() => {
    if (!adh.loading) setDailyDraft(adh.dailyNote);
  }, [adh.dailyNote, adh.loading]);

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
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {headerBadge}
              {planUpdate?.pending ? (
                <Chip tone="primary" className="font-extrabold">
                  Atualização disponível
                </Chip>
              ) : null}
              {formattedDate ? (
                <Chip tone="muted" className="font-bold">
                  Plano atualizado em {formattedDate}
                </Chip>
              ) : null}
            </div>
            {planUpdate?.pending ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="rounded-full px-5"
                disabled={planUpdate.busy}
                onClick={() => planUpdate.onRefresh()}
              >
                {planUpdate.busy ? "Atualizando…" : "Atualizar plano"}
              </Button>
            ) : null}
          </div>
        </div>
        <p className="mx-auto mt-3 max-w-2xl text-body14 leading-relaxed text-text-secondary sm:mx-0">
          Organizamos suas refeições por período do dia. Siga as quantidades e observações indicadas pela sua nutricionista.
        </p>
      </div>

      {enabled && totalMeals > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-bg-0 to-neutral-50/40 p-4 shadow-premium-sm md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-body14 font-extrabold text-text-primary">
              Você completou{" "}
              <span className="text-primary">
                {completedCount} de {totalMeals}
              </span>{" "}
              refeições hoje
            </p>
            <span className="text-title16 font-black tabular-nums text-secondary">{progressPct}%</span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-neutral-200/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {adh.loading ? <p className="mt-2 text-[11px] font-semibold text-text-muted">Sincronizando seu dia…</p> : null}
          {adh.error ? <p className="mt-2 text-[11px] font-bold text-orange">{adh.error}</p> : null}
        </div>
      ) : null}

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
                {list.map((meal) => {
                  const done = Boolean(enabled && adh.mealState[meal.id]?.completed);
                  return (
                    <Card
                      key={meal.id}
                      className={cn(
                        "overflow-hidden border transition-all duration-300 ease-out",
                        done
                          ? "border-emerald-300/70 bg-gradient-to-br from-emerald-50/90 via-bg-0 to-bg-0 shadow-[0_12px_40px_-24px_rgba(16,185,129,0.45)] ring-1 ring-emerald-200/50"
                          : "border-neutral-200/60 bg-bg-0 shadow-premium-sm ring-1 ring-black/[0.02]",
                      )}
                    >
                      <CardHeader className="border-b border-neutral-100/90 pb-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-extrabold text-text-primary">{meal.name}</p>
                              {enabled ? (
                                <Chip tone={done ? "success" : "muted"} className="text-[10px] font-extrabold uppercase">
                                  {done ? "Feito" : "Pendente"}
                                </Chip>
                              ) : null}
                            </div>
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
                        {enabled ? (
                          <div
                            className={cn(
                              "rounded-xl border px-3 py-3 transition-colors duration-300",
                              done ? "border-emerald-200/80 bg-emerald-50/50" : "border-primary/15 bg-primary/[0.04]",
                            )}
                          >
                            <p className="text-[11px] font-extrabold uppercase tracking-wide text-secondary">Seu registro hoje</p>
                            <label className="mt-2 flex cursor-pointer items-center gap-2 text-small12 font-semibold text-text-primary">
                              <input
                                type="checkbox"
                                className={cn(
                                  "h-4 w-4 rounded border-neutral-300 text-primary transition-transform duration-200 focus:ring-primary/30",
                                  done && "scale-110",
                                )}
                                checked={done}
                                onChange={(e) => {
                                  void adh.setMealCompleted(meal.id, e.target.checked);
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
                                value={adh.mealState[meal.id]?.difficulty ?? "none"}
                                onChange={(e) => {
                                  void adh.setMealDifficulty(meal.id, e.target.value as MealDifficulty);
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
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      {enabled ? (
        <Card className="border-neutral-200/60 shadow-premium-sm">
          <CardHeader className="border-b border-neutral-100/90 pb-3">
            <p className="text-title16 font-extrabold text-text-primary">Observação do dia</p>
            <p className="mt-1 text-small12 text-text-secondary">Salvo na sua conta — sua nutricionista pode acompanhar.</p>
          </CardHeader>
          <CardContent className="pt-4">
            <textarea
              rows={4}
              className="w-full resize-y rounded-xl border border-neutral-200/90 bg-bg-0 px-4 py-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-neutral-400 focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
              placeholder="Ex.: senti fome no lanche, treino mais leve que o normal…"
              value={dailyDraft}
              onChange={(e) => setDailyDraft(e.target.value)}
              onBlur={() => {
                if (dailyDraft !== adh.dailyNote) void adh.saveDailyNote(dailyDraft);
              }}
            />
            <p className="mt-2 text-[11px] font-semibold text-text-muted">Salvo ao sair do campo · {logDate}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
