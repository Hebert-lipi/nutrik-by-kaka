"use client";

import * as React from "react";
import type { DraftPatient, MetabolicFormula, NutritionActivityLevel, NutritionGoal, PlanNutritionProfile } from "@/lib/draft-storage";
import type { EngineResult } from "@/lib/nutrition/metabolic-engine";
import type { MacroTotals } from "@/lib/nutrition/food-math";
import { computeMealDistribution } from "@/lib/nutrition/meal-distribution";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

const fieldClass =
  "h-10 w-full rounded-xl border border-neutral-200/90 bg-bg-0 px-3 text-sm font-semibold text-text-primary shadow-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/15";

function pctBadge(p: number): { label: string; tone: "success" | "yellow" | "orange" } {
  if (p >= 95 && p <= 105) return { label: "Dentro da meta", tone: "success" };
  if (p < 95) return { label: "Abaixo da meta", tone: "yellow" };
  return { label: "Acima da meta", tone: "orange" };
}

function Row({ label, actual, target, unit }: { label: string; actual: number; target: number; unit: string }) {
  const pct = target > 0 ? Math.round((actual / target) * 100) : 0;
  const b = pctBadge(pct);
  return (
    <div className="grid gap-2 rounded-xl border border-neutral-200/80 bg-neutral-50/50 px-3 py-2 md:grid-cols-[120px_1fr_auto_auto] md:items-center">
      <p className="text-small12 font-bold text-text-primary">{label}</p>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200/80">
        <div className="h-full rounded-full bg-secondary" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
      <p className="text-small12 font-semibold tabular-nums text-text-secondary">
        {Math.round(actual)} / {Math.round(target)} {unit}
      </p>
      <Chip tone={b.tone}>{b.label}</Chip>
    </div>
  );
}

function MealRow({
  name,
  percent,
  onPercentChange,
  editable,
  target,
  prescribed,
}: {
  name: string;
  percent: number;
  onPercentChange: (next: number) => void;
  editable: boolean;
  target: { kcal: number; protein: number; carbs: number; fat: number };
  prescribed: { kcal: number; protein: number; carbs: number; fat: number };
}) {
  const ratio = target.kcal > 0 ? Math.round((prescribed.kcal / target.kcal) * 100) : 0;
  const b = pctBadge(ratio);
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-bg-0 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-body14 font-semibold text-text-primary">{name || "Refeição"}</p>
        <div className="flex items-center gap-2">
          {editable ? (
            <input
              className="h-9 w-20 rounded-lg border border-neutral-200/90 px-2 text-right text-sm font-semibold"
              type="number"
              step="0.1"
              value={percent}
              onChange={(e) => onPercentChange(Number(e.target.value))}
            />
          ) : (
            <p className="text-small12 font-semibold text-text-secondary">{percent.toFixed(1)}%</p>
          )}
          <Chip tone={b.tone}>{b.label}</Chip>
        </div>
      </div>
      <div className="mt-2 grid gap-1 text-small12 text-text-secondary md:grid-cols-2">
        <p>
          Meta: <span className="font-semibold text-text-primary">{Math.round(target.kcal)} kcal</span> · P {Math.round(target.protein)}g · C {Math.round(target.carbs)}g · G {Math.round(target.fat)}g
        </p>
        <p>
          Prescrito: <span className="font-semibold text-text-primary">{Math.round(prescribed.kcal)} kcal</span> · P {Math.round(prescribed.protein)}g · C {Math.round(prescribed.carbs)}g · G {Math.round(prescribed.fat)}g
        </p>
      </div>
    </div>
  );
}

export function NutritionIntelligencePanel({
  patient,
  profile,
  engine,
  prescribed,
  distributionSummary,
  mealBreakdown,
  onProfileChange,
}: {
  patient: DraftPatient | null;
  profile: PlanNutritionProfile;
  engine: EngineResult;
  prescribed: MacroTotals;
  distributionSummary: { percentSum: number; validPercentSum: boolean };
  mealBreakdown: Array<{
    mealId: string;
    mealName: string;
    percent: number;
    target: { kcal: number; protein: number; carbs: number; fat: number };
    prescribed: { kcal: number; protein: number; carbs: number; fat: number };
  }>;
  onProfileChange: (next: PlanNutritionProfile) => void;
}) {
  const setField = <K extends keyof PlanNutritionProfile>(key: K, value: PlanNutritionProfile[K]) => {
    onProfileChange({ ...profile, [key]: value });
  };
  const formulaOptions: Array<{ id: MetabolicFormula; label: string }> = [
    { id: "mifflin_st_jeor", label: "Mifflin-St Jeor (recomendada)" },
    { id: "harris_benedict", label: "Harris-Benedict" },
    { id: "henry_rees", label: "Henry & Rees" },
    { id: "cunningham", label: "Cunningham" },
  ];
  const activityOptions: Array<{ id: NutritionActivityLevel; label: string }> = [
    { id: "sedentary", label: "Sedentário" },
    { id: "light", label: "Leve" },
    { id: "moderate", label: "Moderado" },
    { id: "intense", label: "Intenso" },
  ];
  const goalOptions: Array<{ id: NutritionGoal; label: string }> = [
    { id: "weight_loss", label: "Emagrecimento" },
    { id: "maintenance", label: "Manutenção" },
    { id: "muscle_gain", label: "Ganho de massa" },
  ];
  const manualMode = profile.mealDistributionMode === "manual";

  const fillManualWithAuto = () => {
    const ok = window.confirm(
      "Redistribuir os percentuais automaticamente?\n\nIsso irá substituir os valores atuais por uma distribuição equilibrada entre as refeições.",
    );
    if (!ok) return;
    const auto = computeMealDistribution(
      mealBreakdown.map((m) => ({ id: m.mealId, name: m.mealName, time: "", observation: "", groups: [] })),
      { ...profile, mealDistributionMode: "auto" },
      engine.targetKcal ?? null,
      engine.macroTargets ?? null,
    );
    setField(
      "mealDistribution",
      auto.items.map((x) => ({ mealId: x.mealId, percent: x.percent })),
    );
  };

  return (
    <Card className="border-secondary/20 bg-gradient-to-br from-secondary/[0.06] via-bg-0 to-neutral-50/40 shadow-premium-sm">
      <CardHeader className="border-b border-neutral-100/90 pb-4">
        <p className="text-title16 font-semibold text-text-primary">Painel nutricional inteligente</p>
        <p className="mt-1 text-small12 font-semibold text-text-secondary">
          Meta calórica e macronutrientes alvo comparados com o prescrito em tempo real.
        </p>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {engine.missing.length > 0 ? (
          <div className="rounded-xl border border-amber-300/60 bg-amber-50/90 px-4 py-3 text-small12 font-semibold text-text-secondary">
            Complete estes dados para cálculo total: {engine.missing.join(", ")}.
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-text-muted">Fórmula metabólica</label>
            <select className={fieldClass} value={profile.formula} onChange={(e) => setField("formula", e.target.value as MetabolicFormula)}>
              {formulaOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-text-muted">Atividade</label>
            <select className={fieldClass} value={profile.activityLevel ?? ""} onChange={(e) => setField("activityLevel", (e.target.value || null) as NutritionActivityLevel | null)}>
              <option value="">Selecione</option>
              {activityOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-text-muted">Objetivo nutricional</label>
            <select className={fieldClass} value={profile.goal ?? ""} onChange={(e) => setField("goal", (e.target.value || null) as NutritionGoal | null)}>
              <option value="">Selecione</option>
              {goalOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-6">
          {[
            ["Sexo", patient?.sex ? (patient.sex === "female" ? "Feminino" : patient.sex === "male" ? "Masculino" : "Outro") : "—"],
            ["Idade", profile.ageYears ? `${profile.ageYears} anos` : "—"],
            ["Peso", profile.weightKg ? `${profile.weightKg} kg` : "—"],
            ["Altura", profile.heightCm ? `${profile.heightCm} cm` : "—"],
            ["TMB", engine.tmb ? `${Math.round(engine.tmb)} kcal` : "—"],
            ["GET", engine.get ? `${Math.round(engine.get)} kcal` : "—"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-neutral-200/75 bg-bg-0 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{k}</p>
              <p className="mt-0.5 text-body14 font-bold text-text-primary">{v}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-text-muted">Ajuste por objetivo (%)</label>
            <input className={fieldClass} type="number" value={profile.adjustmentPercent} onChange={(e) => setField("adjustmentPercent", Number(e.target.value))} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-text-muted">Meta calórica manual</label>
            <input className={fieldClass} type="number" placeholder="usar automático" value={profile.manualTargetKcal ?? ""} onChange={(e) => setField("manualTargetKcal", e.target.value === "" ? null : Number(e.target.value))} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-text-muted">Proteína (g/kg)</label>
            <input className={fieldClass} type="number" step="0.1" value={profile.proteinGPerKg} onChange={(e) => setField("proteinGPerKg", Number(e.target.value))} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-text-muted">Gordura (g/kg)</label>
            <input className={fieldClass} type="number" step="0.1" value={profile.fatGPerKg} onChange={(e) => setField("fatGPerKg", Number(e.target.value))} />
          </div>
        </div>

        {engine.macroTargets && engine.targetKcal ? (
          <div className="space-y-2">
            <div className="rounded-xl border border-neutral-200/80 bg-bg-0 px-3 py-2">
              <p className="text-small12 font-semibold text-text-secondary">
                Meta calórica: <span className="font-bold text-text-primary">{Math.round(engine.targetKcal)} kcal</span>
              </p>
            </div>
            <Row label="Energia" actual={prescribed.kcal} target={engine.targetKcal} unit="kcal" />
            <Row label="Proteína" actual={prescribed.protein} target={engine.macroTargets.proteinG} unit="g" />
            <Row label="Carboidrato" actual={prescribed.carbs} target={engine.macroTargets.carbsG} unit="g" />
            <Row label="Gordura" actual={prescribed.fat} target={engine.macroTargets.fatG} unit="g" />

            <div className="mt-3 rounded-xl border border-neutral-200/80 bg-neutral-50/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-small12 font-bold text-text-primary">Distribuição por refeição</p>
                <div className="flex items-center gap-2">
                  <select
                    className="h-9 rounded-lg border border-neutral-200/90 px-2 text-small12 font-semibold"
                    value={profile.mealDistributionMode}
                    onChange={(e) =>
                      setField("mealDistributionMode", (e.target.value === "manual" ? "manual" : "auto") as PlanNutritionProfile["mealDistributionMode"])
                    }
                  >
                    <option value="auto">Automático</option>
                    <option value="manual">Manual</option>
                  </select>
                  <Chip tone={distributionSummary.validPercentSum ? "success" : "orange"}>
                    Soma: {distributionSummary.percentSum.toFixed(1)}%
                  </Chip>
                  {manualMode ? (
                    <button
                      type="button"
                      onClick={fillManualWithAuto}
                      className="h-9 rounded-lg border border-neutral-200/90 px-3 text-small12 font-semibold text-text-secondary hover:border-neutral-300 hover:text-text-primary"
                    >
                      Redistribuir automaticamente
                    </button>
                  ) : null}
                </div>
              </div>
              {!distributionSummary.validPercentSum ? (
                <p className="mt-2 text-small12 font-semibold text-orange">
                  A soma dos percentuais deve fechar em 100% para manter metas por refeição consistentes.
                </p>
              ) : null}
              <div className="mt-3 space-y-2">
                {mealBreakdown.map((m) => (
                  <MealRow
                    key={m.mealId}
                    name={m.mealName}
                    percent={m.percent}
                    editable={manualMode}
                    onPercentChange={(next) => {
                      const map = new Map(profile.mealDistribution.map((x) => [x.mealId, x.percent]));
                      map.set(m.mealId, Number.isFinite(next) ? next : 0);
                      setField(
                        "mealDistribution",
                        Array.from(map.entries()).map(([mealId, percent]) => ({ mealId, percent })),
                      );
                    }}
                    target={m.target}
                    prescribed={m.prescribed}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-small12 font-semibold text-text-muted">Preencha os dados mínimos para gerar meta e comparação com o prescrito.</p>
        )}
      </CardContent>
    </Card>
  );
}

