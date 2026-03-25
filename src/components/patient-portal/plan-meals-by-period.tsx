"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DraftPlanMeal } from "@/lib/draft-storage";
import { groupMealsByPeriod, MEAL_PERIOD_ORDER, mealPeriodLabel } from "@/lib/clinical/meal-period";
import type { MealDifficulty } from "@/lib/supabase/patient-adherence-db";
import {
  usePatientAdherenceSupabase,
  type PatientAdherenceController,
} from "@/hooks/use-patient-adherence-supabase";
import {
  mealDayStatusForView,
  minutesFromDate,
  STATUS_LABEL,
} from "@/lib/clinical/patient-portal-meal-status";
import { todayPortalLogDate } from "@/lib/clinical/patient-portal-dates";

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
  planUpdate,
  suppressIntroHeader,
  viewLogDate,
  adherenceOverride,
  hideDayProgressBanner,
}: {
  meals: DraftPlanMeal[];
  planName: string;
  subtitle?: string;
  lastUpdatedIso?: string | null;
  className?: string;
  headerBadge?: React.ReactNode;
  adherence?: { patientId: string; planId: string };
  planUpdate?: {
    pending: boolean;
    onRefresh: () => void;
    busy?: boolean;
  };
  /** Cabeçalho do plano (nome, atualização) renderizado na página pai */
  suppressIntroHeader?: boolean;
  /** Dia do registo (YYYY-MM-DD). Por omissão = hoje no dispositivo. */
  viewLogDate?: string;
  /** Quando definido, usa este controlador em vez de criar outro hook (evita pedidos duplicados). */
  adherenceOverride?: PatientAdherenceController | null;
  hideDayProgressBanner?: boolean;
}) {
  const grouped = React.useMemo(() => groupMealsByPeriod(meals), [meals]);
  const todayYmd = React.useMemo(() => todayPortalLogDate(), []);
  const logDate = viewLogDate ?? todayYmd;
  const viewIsToday = logDate === todayYmd;
  const enabled = Boolean(adherence?.patientId && adherence?.planId);

  const [nowTick, setNowTick] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const nowMinutes = React.useMemo(() => minutesFromDate(new Date(nowTick)), [nowTick]);

  const internalAdh = usePatientAdherenceSupabase(adherence?.patientId, adherence?.planId, logDate, enabled && !adherenceOverride);
  const adh = adherenceOverride ?? internalAdh;

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
    <div className={cn("touch-manipulation space-y-6 sm:space-y-8 md:space-y-10", className)}>
      {suppressIntroHeader ? <h2 className="sr-only">{planName}</h2> : null}
      {!suppressIntroHeader ? (
        <div className="text-center sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <p className="text-small12 font-bold uppercase tracking-[0.14em] text-secondary">{subtitle ?? "Plano alimentar"}</p>
              <h1 className="mt-1 text-[1.65rem] font-semibold leading-tight tracking-tight text-text-primary sm:text-3xl">{planName}</h1>
            </div>
            <div className="flex flex-col items-center gap-2 sm:items-end">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {headerBadge}
                {planUpdate?.pending ? (
                  <Chip tone="primary" className="font-semibold">
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
                  size="md"
                  className="min-h-11 w-full rounded-full px-5 sm:min-h-9 sm:w-auto"
                  disabled={planUpdate.busy}
                  onClick={() => planUpdate.onRefresh()}
                >
                  {planUpdate.busy ? "Atualizando…" : "Atualizar plano"}
                </Button>
              ) : null}
            </div>
          </div>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-text-secondary sm:mx-0">
            Organizamos suas refeições por período do dia. Siga as quantidades e observações indicadas pela sua nutricionista.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {headerBadge}
            {planUpdate?.pending ? (
              <Chip tone="primary" className="font-semibold">
                Atualização disponível
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
      )}

      {totalMeals > 0 && !hideDayProgressBanner ? (
        <div className="overflow-hidden rounded-[1.25rem] border border-neutral-200/70 bg-white px-5 py-5 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.22)] ring-1 ring-black/[0.03] md:px-6 md:py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                {viewIsToday ? "Progresso de hoje" : "Progresso neste dia"}
              </p>
              <p className="mt-1.5 text-[17px] font-semibold tracking-tight text-text-primary">
                Você concluiu{" "}
                <span className="text-secondary">
                  {completedCount} de {totalMeals}
                </span>{" "}
                {viewIsToday ? "refeições hoje" : "refeições neste dia"}
              </p>
            </div>
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-secondary">{progressPct}%</p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-secondary via-primary to-secondary/90 transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%`, minWidth: progressPct > 0 ? "4px" : undefined }}
            />
          </div>
          {enabled && adh.loading ? (
            <p className="mt-3 text-[12px] font-medium text-text-muted">Sincronizando seu dia…</p>
          ) : null}
          {enabled && adh.error ? <p className="mt-3 text-[12px] font-semibold text-orange">{adh.error}</p> : null}
          {!enabled && totalMeals > 0 ? (
            <p className="mt-3 text-[12px] leading-relaxed text-text-muted">
              Marque as refeições conforme for realizando-as — seus registros ajudam no acompanhamento.
            </p>
          ) : null}
        </div>
      ) : null}

      {meals.length === 0 ? (
        <Card className="border-dashed border-neutral-200/90 bg-neutral-50/30">
          <CardContent className="py-16 text-center text-[15px] leading-relaxed text-text-secondary">
            Nenhuma refeição cadastrada neste plano ainda.
          </CardContent>
        </Card>
      ) : (
        MEAL_PERIOD_ORDER.map((period) => {
          const list = grouped.get(period);
          if (!list?.length) return null;
          return (
            <section key={period} className="relative isolate space-y-4 sm:space-y-5">
              {/* Sem tracking-tight: no iOS/WebKit costuma causar “dupla”/fantasma com fixed + blur por baixo. */}
              <h2 className="text-[1.05rem] font-semibold text-text-primary sm:text-lg">{mealPeriodLabel(period)}</h2>
              <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                {list.map((meal) => {
                  const done = Boolean(enabled && adh.mealState[meal.id]?.completed);
                  const status = mealDayStatusForView(done, meal.time, nowMinutes, viewIsToday);
                  const statusChipTone =
                    status === "completed" ? "success" : status === "overdue" ? "orange" : "muted";
                  return (
                    <Card
                      key={meal.id}
                      className={cn(
                        "overflow-hidden rounded-3xl border transition-all duration-300 ease-out",
                        status === "completed" &&
                          "border-emerald-200/70 bg-gradient-to-b from-emerald-50/90 to-white shadow-[0_24px_50px_-32px_rgba(34,110,72,0.22)] ring-1 ring-emerald-100/50",
                        status === "pending" &&
                          "border-neutral-200/60 bg-white shadow-[0_20px_44px_-34px_rgba(15,23,42,0.1)] ring-1 ring-black/[0.025]",
                        status === "overdue" &&
                          "border-rose-200/75 bg-gradient-to-b from-rose-50/75 to-white shadow-[0_24px_48px_-32px_rgba(225,29,72,0.14)] ring-1 ring-rose-100/60",
                      )}
                    >
                      <CardHeader className="border-b border-neutral-100/90 pb-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[17px] font-semibold text-text-primary">{meal.name}</p>
                              <Chip tone={statusChipTone} className="text-[10px] font-semibold uppercase tracking-wide">
                                {STATUS_LABEL[status]}
                              </Chip>
                            </div>
                            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                              Horário sugerido · {meal.time}
                            </p>
                          </div>
                        </div>
                        {meal.observation ? (
                          <p className="mt-3 text-[14px] leading-relaxed text-text-secondary">{meal.observation}</p>
                        ) : null}
                      </CardHeader>
                      <CardContent className="space-y-3.5 pt-5">
                        {formatOptionLine(meal).map((row, idx) => (
                          <div
                            key={`${meal.id}-${idx}`}
                            className="rounded-xl border border-neutral-100 bg-neutral-50/50 px-3.5 py-3 text-[13px] leading-snug"
                          >
                            <p className="font-semibold text-text-primary">
                              <span className="font-medium text-text-muted">{row.group}: </span>
                              {row.line}
                            </p>
                            <p className="mt-1.5 font-medium text-text-secondary">{row.qty}</p>
                            {row.note ? <p className="mt-2 text-[12px] leading-relaxed text-text-muted">{row.note}</p> : null}
                            {row.recipe ? (
                              <p className="mt-2 rounded-lg bg-white/90 p-2.5 text-[12px] leading-relaxed text-text-secondary ring-1 ring-neutral-100">
                                <span className="font-semibold text-text-primary">Preparo: </span>
                                {row.recipe}
                              </p>
                            ) : null}
                          </div>
                        ))}
                        {enabled ? (
                          <div
                            className={cn(
                              "rounded-xl border px-3.5 py-3.5 transition-colors duration-300",
                              done ? "border-emerald-200/80 bg-emerald-50/40" : "border-neutral-200/70 bg-neutral-50/40",
                            )}
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary">
                              {viewIsToday ? "Seu registro hoje" : "Registro deste dia"}
                            </p>
                            <label className="mt-2.5 flex min-h-11 cursor-pointer items-center gap-3 text-[14px] font-semibold text-text-primary sm:min-h-0 sm:text-[13px]">
                              <input
                                type="checkbox"
                                className={cn(
                                  "h-5 w-5 shrink-0 rounded border-2 border-neutral-300 text-primary focus:ring-primary/25 sm:h-[1.125rem] sm:w-[1.125rem] sm:border",
                                  done && "scale-105",
                                )}
                                checked={done}
                                onChange={(e) => {
                                  void adh.setMealCompleted(meal.id, e.target.checked);
                                }}
                              />
                              Marquei esta refeição como realizada
                            </label>
                            <div className="mt-3">
                              <label className="text-[11px] font-bold text-text-muted" htmlFor={`diff-${meal.id}`}>
                                Dificuldade em seguir
                              </label>
                              <select
                                id={`diff-${meal.id}`}
                                className="mt-1.5 min-h-12 w-full rounded-xl border border-neutral-200/80 bg-white px-3 py-3 text-base font-semibold text-text-primary shadow-sm sm:min-h-0 sm:py-2.5 sm:text-[13px]"
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
        <Card className="border-neutral-200/60 bg-white shadow-[0_16px_40px_-28px_rgba(15,23,42,0.14)] ring-1 ring-black/[0.03]">
          <CardHeader className="border-b border-neutral-100 pb-4 pt-5">
            <p className="text-title16 font-semibold text-text-primary">Como foi seu dia?</p>
            <p className="mt-2 rounded-xl border border-secondary/15 bg-secondary/[0.06] px-3.5 py-2.5 text-[13px] font-medium leading-relaxed text-text-secondary">
              Seus registros são acompanhados pela nutricionista. Use o espaço abaixo para anotar sensações, dúvidas ou
              imprevistos — isso enriquece o próximo atendimento.
            </p>
          </CardHeader>
          <CardContent className="pt-5">
            <textarea
              rows={5}
              className="min-h-[8.5rem] w-full resize-y rounded-xl border border-neutral-200/90 bg-neutral-50/40 px-4 py-3.5 text-[16px] leading-relaxed text-text-primary shadow-inner outline-none placeholder:text-neutral-400 focus:border-secondary/35 focus:bg-white focus:ring-2 focus:ring-secondary/15 sm:min-h-0 sm:text-[15px]"
              placeholder="Ex.: senti mais fome no lanche, treino mais leve, experimentei substituir o arroz…"
              value={dailyDraft}
              onChange={(e) => setDailyDraft(e.target.value)}
              onBlur={() => {
                if (dailyDraft !== adh.dailyNote) void adh.saveDailyNote(dailyDraft);
              }}
            />
            <p className="mt-2.5 text-[11px] font-medium text-text-muted">
              Salvo ao sair do campo ·{" "}
              {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(`${logDate}T12:00:00`))}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
