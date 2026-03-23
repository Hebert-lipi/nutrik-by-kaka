"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button, buttonClassName } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { MiniLineChart } from "@/components/ui/mini-line-chart";
import Link from "next/link";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";
import { useSupabaseDietPlans } from "@/hooks/use-supabase-diet-plans";
import { useSupabasePatientAssessments } from "@/hooks/use-supabase-patient-assessments";
import {
  activityLabel,
  ageFromBirthDateAtDate,
  computeAssessment,
  goalLabel,
  type BodyFormula,
  type AssessmentInput,
} from "@/lib/clinical/assessment-math";
import type { NutritionActivityLevel, NutritionGoal, PatientSex } from "@/lib/draft-storage";
import type { UpsertPatientAssessmentInput } from "@/lib/supabase/patient-assessments";
import { getPublishedPlanForPatient } from "@/lib/clinical/patient-plan";
import { formatPatientDateTime } from "@/lib/patients/patient-display";
import {
  COMPARISON_GROUPS,
  formatComparisonValue,
  getNumericComparisonValue,
  type AssessmentComparisonMetric,
} from "@/lib/clinical/assessment-comparison";

type NumFields =
  | "weight_kg"
  | "height_cm"
  | "waist_cm"
  | "hip_cm"
  | "abdomen_cm"
  | "chest_cm"
  | "arm_cm"
  | "thigh_cm"
  | "calf_cm"
  | "triceps_mm"
  | "biceps_mm"
  | "subscapular_mm"
  | "suprailiac_mm"
  | "abdominal_mm"
  | "chest_skinfold_mm"
  | "midaxillary_mm"
  | "thigh_skinfold_mm"
  | "calf_skinfold_mm";

type FormState = {
  id?: string;
  assessment_date: string;
  weight_kg: string;
  height_cm: string;
  waist_cm: string;
  hip_cm: string;
  abdomen_cm: string;
  chest_cm: string;
  arm_cm: string;
  thigh_cm: string;
  calf_cm: string;
  triceps_mm: string;
  biceps_mm: string;
  subscapular_mm: string;
  suprailiac_mm: string;
  abdominal_mm: string;
  chest_skinfold_mm: string;
  midaxillary_mm: string;
  thigh_skinfold_mm: string;
  calf_skinfold_mm: string;
  body_formula: BodyFormula;
  notes: string;
};

const FORMULA_LABEL: Record<BodyFormula, string> = {
  jackson_pollock_3: "Jackson & Pollock (3 dobras)",
  jackson_pollock_7: "Jackson & Pollock (7 dobras)",
  durnin_womersley: "Durnin-Womersley",
  slaughter: "Slaughter",
  petroski: "Petroski",
};

const selectClass =
  "h-10 w-full rounded-xl border border-neutral-200/90 bg-bg-0 px-3 text-sm font-semibold text-text-primary shadow-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/15";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function emptyForm(): FormState {
  return {
    assessment_date: todayIso(),
    weight_kg: "",
    height_cm: "",
    waist_cm: "",
    hip_cm: "",
    abdomen_cm: "",
    chest_cm: "",
    arm_cm: "",
    thigh_cm: "",
    calf_cm: "",
    triceps_mm: "",
    biceps_mm: "",
    subscapular_mm: "",
    suprailiac_mm: "",
    abdominal_mm: "",
    chest_skinfold_mm: "",
    midaxillary_mm: "",
    thigh_skinfold_mm: "",
    calf_skinfold_mm: "",
    body_formula: "jackson_pollock_3",
    notes: "",
  };
}

function asNum(s: string): number | null {
  if (!s.trim()) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export default function PatientAvaliacoesPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = typeof params.patientId === "string" ? params.patientId : "";
  const { patients, loading: lp } = useSupabasePatients();
  const { plans } = useSupabaseDietPlans();
  const { items, loading, error, save, remove } = useSupabasePatientAssessments(patientId);
  const patient = patients.find((p) => p.id === patientId) ?? null;
  const [form, setForm] = React.useState<FormState>(emptyForm());
  const [openForm, setOpenForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<"history" | "comparison">("history");
  const [comparisonIds, setComparisonIds] = React.useState<string[]>([]);
  const [sectionsOpen, setSectionsOpen] = React.useState({
    basic: true,
    circumferences: false,
    skinfolds: false,
    notes: true,
  });

  const selected = items.find((x) => x.id === selectedId) ?? items[0] ?? null;
  const previous = selected ? items.filter((x) => x.assessment_date < selected.assessment_date)[0] ?? null : null;
  const activePlan = patient ? getPublishedPlanForPatient(patient.id, plans) : null;

  React.useEffect(() => {
    if (openForm || !patient) return;
    setForm((prev) => ({
      ...prev,
      weight_kg: prev.weight_kg || (patient.weightKg != null ? String(patient.weightKg) : ""),
      height_cm: prev.height_cm || (patient.heightCm != null ? String(patient.heightCm) : ""),
    }));
  }, [openForm, patient]);

  const inputForCalc: AssessmentInput = React.useMemo(
    () => ({
      sex: patient?.sex ?? null,
      ageYears: ageFromBirthDateAtDate(patient?.birthDate, form.assessment_date),
      weightKg: asNum(form.weight_kg),
      heightCm: asNum(form.height_cm),
      waistCm: asNum(form.waist_cm),
      hipCm: asNum(form.hip_cm),
      tricepsMm: asNum(form.triceps_mm),
      bicepsMm: asNum(form.biceps_mm),
      subscapularMm: asNum(form.subscapular_mm),
      suprailiacMm: asNum(form.suprailiac_mm),
      abdominalMm: asNum(form.abdominal_mm),
      chestSkinfoldMm: asNum(form.chest_skinfold_mm),
      midaxillaryMm: asNum(form.midaxillary_mm),
      thighSkinfoldMm: asNum(form.thigh_skinfold_mm),
      calfSkinfoldMm: asNum(form.calf_skinfold_mm),
      formula: form.body_formula,
    }),
    [patient?.sex, patient?.birthDate, form],
  );
  const computed = React.useMemo(() => computeAssessment(inputForCalc), [inputForCalc]);

  const setNumField = (key: NumFields, value: string) => setForm((p) => ({ ...p, [key]: value }));
  const toggleSection = (key: keyof typeof sectionsOpen) =>
    setSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  const allExpanded =
    sectionsOpen.basic &&
    sectionsOpen.circumferences &&
    sectionsOpen.skinfolds &&
    sectionsOpen.notes;

  const startNew = () => {
    setForm({
      ...emptyForm(),
      weight_kg: patient?.weightKg != null ? String(patient.weightKg) : "",
      height_cm: patient?.heightCm != null ? String(patient.heightCm) : "",
    });
    setOpenForm(true);
    setActionError(null);
  };

  const editRow = (id: string) => {
    const row = items.find((x) => x.id === id);
    if (!row) return;
    setForm({
      id: row.id,
      assessment_date: row.assessment_date,
      weight_kg: row.weight_kg?.toString() ?? "",
      height_cm: row.height_cm?.toString() ?? "",
      waist_cm: row.waist_cm?.toString() ?? "",
      hip_cm: row.hip_cm?.toString() ?? "",
      abdomen_cm: row.abdomen_cm?.toString() ?? "",
      chest_cm: row.chest_cm?.toString() ?? "",
      arm_cm: row.arm_cm?.toString() ?? "",
      thigh_cm: row.thigh_cm?.toString() ?? "",
      calf_cm: row.calf_cm?.toString() ?? "",
      triceps_mm: row.triceps_mm?.toString() ?? "",
      biceps_mm: row.biceps_mm?.toString() ?? "",
      subscapular_mm: row.subscapular_mm?.toString() ?? "",
      suprailiac_mm: row.suprailiac_mm?.toString() ?? "",
      abdominal_mm: row.abdominal_mm?.toString() ?? "",
      chest_skinfold_mm: row.chest_skinfold_mm?.toString() ?? "",
      midaxillary_mm: row.midaxillary_mm?.toString() ?? "",
      thigh_skinfold_mm: row.thigh_skinfold_mm?.toString() ?? "",
      calf_skinfold_mm: row.calf_skinfold_mm?.toString() ?? "",
      body_formula: row.body_formula ?? "jackson_pollock_3",
      notes: row.notes ?? "",
    });
    setOpenForm(true);
  };

  async function submit() {
    if (!patient) return;
    setSaving(true);
    setActionError(null);
    try {
      const payload: UpsertPatientAssessmentInput = {
        id: form.id,
        patient_id: patient.id,
        assessment_date: form.assessment_date,
        weight_kg: asNum(form.weight_kg),
        height_cm: asNum(form.height_cm),
        waist_cm: asNum(form.waist_cm),
        hip_cm: asNum(form.hip_cm),
        abdomen_cm: asNum(form.abdomen_cm),
        chest_cm: asNum(form.chest_cm),
        arm_cm: asNum(form.arm_cm),
        thigh_cm: asNum(form.thigh_cm),
        calf_cm: asNum(form.calf_cm),
        triceps_mm: asNum(form.triceps_mm),
        biceps_mm: asNum(form.biceps_mm),
        subscapular_mm: asNum(form.subscapular_mm),
        suprailiac_mm: asNum(form.suprailiac_mm),
        abdominal_mm: asNum(form.abdominal_mm),
        chest_skinfold_mm: asNum(form.chest_skinfold_mm),
        midaxillary_mm: asNum(form.midaxillary_mm),
        thigh_skinfold_mm: asNum(form.thigh_skinfold_mm),
        calf_skinfold_mm: asNum(form.calf_skinfold_mm),
        sex_at_assessment: (patient.sex ?? null) as PatientSex | null,
        age_at_assessment: ageFromBirthDateAtDate(patient.birthDate, form.assessment_date),
        activity_level_snapshot: (patient.activityLevel ?? null) as NutritionActivityLevel | null,
        goal_snapshot: (patient.nutritionGoal ?? null) as NutritionGoal | null,
        body_formula: form.body_formula,
        body_density: computed.composition.bodyDensity,
        body_fat_pct: computed.composition.bodyFatPct,
        fat_mass_kg: computed.composition.fatMassKg,
        lean_mass_kg: computed.composition.leanMassKg,
        plan_id_snapshot: activePlan?.id ?? null,
        plan_title_snapshot: activePlan?.name ?? null,
        notes: form.notes.trim(),
      };
      await save(payload);
      setOpenForm(false);
      setForm(emptyForm());
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Erro ao salvar avaliação.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCurrent(id: string) {
    const ok = window.confirm("Excluir esta avaliação? Essa ação não pode ser desfeita.");
    if (!ok) return;
    try {
      await remove(id);
      if (selectedId === id) setSelectedId(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Erro ao excluir avaliação.");
    }
  }

  if (!patientId) return <EmptyState title="Paciente inválido" action={{ label: "Voltar", onClick: () => router.push("/patients") }} />;
  if (lp) return <div className="flex min-h-[40vh] items-center justify-center text-body14 font-semibold text-text-muted">Carregando…</div>;
  if (!patient) return <EmptyState title="Paciente não encontrado" action={{ label: "Pacientes", onClick: () => router.push("/patients") }} />;

  const chartWeight = [...items].reverse().filter((x) => x.weight_kg != null);
  const chartBmi = [...items]
    .reverse()
    .map((x) => {
      const w = x.weight_kg;
      const h = x.height_cm;
      if (!w || !h) return null;
      const bmi = w / Math.pow(h / 100, 2);
      return { date: x.assessment_date.slice(5), value: Number.isFinite(bmi) ? Math.round(bmi * 100) / 100 : null };
    })
    .filter(Boolean) as Array<{ date: string; value: number }>;
  const chartFat = [...items].reverse().filter((x) => x.body_fat_pct != null);
  const chartLean = [...items].reverse().filter((x) => x.lean_mass_kg != null);
  const comparisonRows = items.filter((x) => comparisonIds.includes(x.id));

  function toggleComparisonRow(id: string) {
    setComparisonIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

  function resetComparisonSelection() {
    setComparisonIds(items.slice(0, 2).map((x) => x.id));
  }

  function deltaLabel(metric: AssessmentComparisonMetric, currentIdx: number): string {
    if (currentIdx === 0) return "—";
    const row = comparisonRows[currentIdx];
    const prev = comparisonRows[currentIdx - 1];
    if (!row || !prev) return "—";
    const current = getNumericComparisonValue(metric, row);
    const previous = getNumericComparisonValue(metric, prev);
    if (current == null || previous == null) return "—";
    const delta = current - previous;
    const signal = delta > 0 ? "+" : "";
    const suffix = metric.deltaUnit ?? metric.unit ?? "";
    return `${signal}${delta.toFixed(2)}${suffix ? ` ${suffix}` : ""}`;
  }

  function deltaTone(metric: AssessmentComparisonMetric, currentIdx: number): string {
    if (currentIdx === 0) return "text-text-muted";
    const row = comparisonRows[currentIdx];
    const prev = comparisonRows[currentIdx - 1];
    if (!row || !prev) return "text-text-muted";
    const current = getNumericComparisonValue(metric, row);
    const previous = getNumericComparisonValue(metric, prev);
    if (current == null || previous == null) return "text-text-muted";
    const delta = current - previous;
    if (delta < 0) return "text-secondary";
    if (delta > 0) return "text-orange";
    return "text-text-muted";
  }

  React.useEffect(() => {
    if (items.length < 2) return;
    setComparisonIds((prev) => {
      if (prev.length > 0) return prev.filter((id) => items.some((x) => x.id === id));
      return items.slice(0, 2).map((x) => x.id);
    });
  }, [items]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">Acompanhamento</p>
          <h2 className="mt-1 text-title16 font-semibold text-text-primary md:text-h4">Avaliações e evolução</h2>
          <p className="mt-2 max-w-3xl text-small12 font-semibold text-text-secondary">
            Histórico clínico do paciente com indicadores automáticos e composição corporal avançada.
          </p>
        </div>
        <Button type="button" variant="primary" onClick={startNew}>
          Nova avaliação
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={buttonClassName(viewMode === "history" ? "secondary" : "outline", "sm", "rounded-lg")}
          onClick={() => setViewMode("history")}
        >
          Histórico e evolução
        </button>
        <button
          type="button"
          className={buttonClassName(viewMode === "comparison" ? "secondary" : "outline", "sm", "rounded-lg")}
          onClick={() => setViewMode("comparison")}
        >
          Comparação de avaliações
        </button>
      </div>

      {error || actionError ? (
        <p className="rounded-xl border border-orange/30 bg-orange/10 px-4 py-3 text-small12 font-bold text-text-secondary">{error ?? actionError}</p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-5">
        <Card className="border-neutral-200/55"><CardContent className="p-4"><p className="text-[10px] font-semibold uppercase text-text-muted">Última avaliação</p><p className="mt-1 text-body14 font-bold text-text-primary">{items[0]?.assessment_date ?? "—"}</p></CardContent></Card>
        <Card className="border-neutral-200/55"><CardContent className="p-4"><p className="text-[10px] font-semibold uppercase text-text-muted">Peso atual</p><p className="mt-1 text-body14 font-bold text-text-primary">{items[0]?.weight_kg != null ? `${items[0].weight_kg} kg` : "—"}</p></CardContent></Card>
        <Card className="border-neutral-200/55"><CardContent className="p-4"><p className="text-[10px] font-semibold uppercase text-text-muted">IMC atual</p><p className="mt-1 text-body14 font-bold text-text-primary">{items[0]?.weight_kg && items[0]?.height_cm ? (items[0].weight_kg / Math.pow(items[0].height_cm / 100, 2)).toFixed(2) : "—"}</p></CardContent></Card>
        <Card className="border-neutral-200/55"><CardContent className="p-4"><p className="text-[10px] font-semibold uppercase text-text-muted">% gordura</p><p className="mt-1 text-body14 font-bold text-text-primary">{items[0]?.body_fat_pct != null ? `${items[0].body_fat_pct}%` : "—"}</p></CardContent></Card>
        <Card className="border-neutral-200/55"><CardContent className="p-4"><p className="text-[10px] font-semibold uppercase text-text-muted">Massa magra</p><p className="mt-1 text-body14 font-bold text-text-primary">{items[0]?.lean_mass_kg != null ? `${items[0].lean_mass_kg} kg` : "—"}</p></CardContent></Card>
      </div>

      {openForm ? (
        <Card className="border-primary/20 shadow-premium-sm">
          <CardHeader className="border-b border-neutral-100/90 pb-4">
            <p className="text-title16 font-semibold text-text-primary">{form.id ? "Editar avaliação" : "Nova avaliação"}</p>
            <p className="mt-1 text-small12 text-text-secondary">Dados básicos, circunferências, dobras e cálculo automático.</p>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-small12 font-semibold"
                onClick={() =>
                  setSectionsOpen({
                    basic: !allExpanded,
                    circumferences: !allExpanded,
                    skinfolds: !allExpanded,
                    notes: !allExpanded,
                  })
                }
              >
                {allExpanded ? "Recolher tudo" : "Expandir tudo"}
              </Button>
            </div>
            <section className="space-y-3">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-neutral-200/80 bg-neutral-50/50 px-3 py-2 text-left"
                onClick={() => toggleSection("basic")}
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">Dados básicos</p>
                <span className="text-small12 font-semibold text-text-secondary">{sectionsOpen.basic ? "Ocultar" : "Expandir"}</span>
              </button>
              {sectionsOpen.basic ? (
                <div className="grid gap-3 md:grid-cols-4">
                  <div><label className="mb-1 block text-[11px] font-semibold text-text-muted">Data</label><input type="date" className={selectClass} value={form.assessment_date} onChange={(e) => setForm((p) => ({ ...p, assessment_date: e.target.value }))} /></div>
                  <Input label="Peso (kg)" type="number" step="0.1" value={form.weight_kg} onChange={(e) => setNumField("weight_kg", e.target.value)} />
                  <Input label="Altura (cm)" type="number" step="0.1" value={form.height_cm} onChange={(e) => setNumField("height_cm", e.target.value)} />
                  <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase text-text-muted">Indicadores automáticos</p>
                    <p className="mt-1 text-small12 text-text-secondary">IMC {computed.basics.bmi ?? "—"} · RCQ {computed.basics.whr ?? "—"} · Cintura/estatura {computed.basics.whtr ?? "—"}</p>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="space-y-3">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-neutral-200/80 bg-neutral-50/50 px-3 py-2 text-left"
                onClick={() => toggleSection("circumferences")}
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">Circunferências (cm)</p>
                <span className="text-small12 font-semibold text-text-secondary">{sectionsOpen.circumferences ? "Ocultar" : "Expandir"}</span>
              </button>
              {sectionsOpen.circumferences ? (
                <div className="grid gap-3 md:grid-cols-4">
                  <Input label="Cintura" type="number" step="0.1" value={form.waist_cm} onChange={(e) => setNumField("waist_cm", e.target.value)} />
                  <Input label="Quadril" type="number" step="0.1" value={form.hip_cm} onChange={(e) => setNumField("hip_cm", e.target.value)} />
                  <Input label="Abdômen" type="number" step="0.1" value={form.abdomen_cm} onChange={(e) => setNumField("abdomen_cm", e.target.value)} />
                  <Input label="Peito" type="number" step="0.1" value={form.chest_cm} onChange={(e) => setNumField("chest_cm", e.target.value)} />
                  <Input label="Braço" type="number" step="0.1" value={form.arm_cm} onChange={(e) => setNumField("arm_cm", e.target.value)} />
                  <Input label="Coxa" type="number" step="0.1" value={form.thigh_cm} onChange={(e) => setNumField("thigh_cm", e.target.value)} />
                  <Input label="Panturrilha" type="number" step="0.1" value={form.calf_cm} onChange={(e) => setNumField("calf_cm", e.target.value)} />
                </div>
              ) : null}
            </section>

            <section className="space-y-3">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-neutral-200/80 bg-neutral-50/50 px-3 py-2 text-left"
                onClick={() => toggleSection("skinfolds")}
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">Dobras cutâneas (mm)</p>
                <span className="text-small12 font-semibold text-text-secondary">{sectionsOpen.skinfolds ? "Ocultar" : "Expandir"}</span>
              </button>
              {sectionsOpen.skinfolds ? (
                <div className="grid gap-3 md:grid-cols-4">
                  <Input label="Tríceps" type="number" step="0.1" value={form.triceps_mm} onChange={(e) => setNumField("triceps_mm", e.target.value)} />
                  <Input label="Bíceps" type="number" step="0.1" value={form.biceps_mm} onChange={(e) => setNumField("biceps_mm", e.target.value)} />
                  <Input label="Subescapular" type="number" step="0.1" value={form.subscapular_mm} onChange={(e) => setNumField("subscapular_mm", e.target.value)} />
                  <Input label="Supra-ilíaca" type="number" step="0.1" value={form.suprailiac_mm} onChange={(e) => setNumField("suprailiac_mm", e.target.value)} />
                  <Input label="Abdominal" type="number" step="0.1" value={form.abdominal_mm} onChange={(e) => setNumField("abdominal_mm", e.target.value)} />
                  <Input label="Peitoral" type="number" step="0.1" value={form.chest_skinfold_mm} onChange={(e) => setNumField("chest_skinfold_mm", e.target.value)} />
                  <Input label="Axilar média" type="number" step="0.1" value={form.midaxillary_mm} onChange={(e) => setNumField("midaxillary_mm", e.target.value)} />
                  <Input label="Coxa (dobra)" type="number" step="0.1" value={form.thigh_skinfold_mm} onChange={(e) => setNumField("thigh_skinfold_mm", e.target.value)} />
                  <Input label="Panturrilha (dobra)" type="number" step="0.1" value={form.calf_skinfold_mm} onChange={(e) => setNumField("calf_skinfold_mm", e.target.value)} />
                </div>
              ) : null}
            </section>

            <section className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">Composição corporal</p>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-text-muted">Fórmula</label>
                  <select className={selectClass} value={form.body_formula} onChange={(e) => setForm((p) => ({ ...p, body_formula: e.target.value as BodyFormula }))}>
                    {(Object.keys(FORMULA_LABEL) as BodyFormula[]).map((f) => (
                      <option key={f} value={f}>{FORMULA_LABEL[f]}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 px-3 py-2 md:col-span-2">
                  {computed.composition.bodyFatPct != null ? (
                    <p className="text-small12 text-text-secondary">
                      Densidade <span className="font-bold text-text-primary">{computed.composition.bodyDensity}</span> · % gordura{" "}
                      <span className="font-bold text-text-primary">{computed.composition.bodyFatPct}%</span> · Massa gorda{" "}
                      <span className="font-bold text-text-primary">{computed.composition.fatMassKg} kg</span> · Massa magra{" "}
                      <span className="font-bold text-text-primary">{computed.composition.leanMassKg} kg</span>
                    </p>
                  ) : (
                    <p className="text-small12 text-text-secondary">
                      Não há dados suficientes para calcular esta fórmula. Campos necessários: {computed.composition.required.join(", ")}.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-neutral-200/80 bg-neutral-50/50 px-3 py-2 text-left"
                onClick={() => toggleSection("notes")}
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">Observações</p>
                <span className="text-small12 font-semibold text-text-secondary">{sectionsOpen.notes ? "Ocultar" : "Expandir"}</span>
              </button>
              {sectionsOpen.notes ? (
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-neutral-200/90 bg-bg-0 px-4 py-3 text-sm text-text-primary shadow-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
                  placeholder="Resumo clínico, percepção da evolução, conduta..."
                />
              ) : null}
            </section>

            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
              <Button type="button" variant="primary" disabled={saving} onClick={() => void submit()}>{saving ? "Salvando..." : "Salvar avaliação"}</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {viewMode === "history" ? (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="border-neutral-200/55">
              <CardHeader><p className="text-title16 font-semibold text-text-primary">Gráficos de evolução</p></CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Peso</p>
                  {chartWeight.length > 1 ? (
                    <MiniLineChart values={chartWeight.map((x) => Number(x.weight_kg))} labels={chartWeight.map((x) => x.assessment_date.slice(5))} />
                  ) : <p className="text-small12 text-text-muted">Sem dados suficientes para gráfico de peso.</p>}
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">IMC</p>
                  {chartBmi.length > 1 ? (
                    <MiniLineChart values={chartBmi.map((x) => x.value)} labels={chartBmi.map((x) => x.date)} />
                  ) : <p className="text-small12 text-text-muted">Sem dados suficientes para gráfico de IMC.</p>}
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">% gordura</p>
                  {chartFat.length > 1 ? (
                    <MiniLineChart values={chartFat.map((x) => Number(x.body_fat_pct))} labels={chartFat.map((x) => x.assessment_date.slice(5))} />
                  ) : <p className="text-small12 text-text-muted">Sem dados suficientes para gráfico de gordura.</p>}
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Massa magra</p>
                  {chartLean.length > 1 ? (
                    <MiniLineChart values={chartLean.map((x) => Number(x.lean_mass_kg))} labels={chartLean.map((x) => x.assessment_date.slice(5))} />
                  ) : <p className="text-small12 text-text-muted">Sem dados suficientes para gráfico de massa magra.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-200/55">
              <CardHeader className="border-b border-neutral-100/90 pb-3">
                <p className="text-title16 font-semibold text-text-primary">Histórico de avaliações</p>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <p className="p-5 text-small12 font-semibold text-text-muted">Carregando avaliações...</p>
                ) : items.length === 0 ? (
                  <div className="p-5"><EmptyState title="Sem avaliações" description="Crie a primeira avaliação para iniciar a evolução clínica." action={{ label: "Nova avaliação", onClick: startNew }} /></div>
                ) : (
                  <ul className="divide-y divide-neutral-100/90">
                    {items.map((row) => (
                      <li key={row.id} className="px-4 py-3 md:px-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button type="button" className="text-left" onClick={() => setSelectedId(row.id)}>
                            <p className="text-body14 font-semibold text-text-primary">{row.assessment_date}</p>
                            <p className="text-small12 text-text-secondary">{row.weight_kg != null ? `${row.weight_kg} kg` : "sem peso"} · {row.body_fat_pct != null ? `${row.body_fat_pct}% gordura` : "sem % gordura"}</p>
                          </button>
                          <div className="flex items-center gap-2">
                            {selected?.id === row.id ? <Chip tone="primary">Selecionada</Chip> : null}
                            <Button type="button" variant="outline" size="sm" onClick={() => editRow(row.id)}>Editar</Button>
                            <Button type="button" variant="ghost" size="sm" className="text-orange" onClick={() => void deleteCurrent(row.id)}>Excluir</Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      ) : (
        <Card className="border-primary/20 shadow-premium-sm">
          <CardHeader className="border-b border-neutral-100/90 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-title16 font-semibold text-text-primary">Comparação de avaliações</p>
                <p className="mt-1 text-small12 text-text-secondary">Selecione 2 ou mais avaliações para comparar lado a lado.</p>
              </div>
              <button type="button" className={buttonClassName("outline", "sm", "rounded-lg")} onClick={resetComparisonSelection}>
                Selecionar últimas 2
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-2">
              {items.map((row) => {
                const active = comparisonIds.includes(row.id);
                return (
                  <button
                    key={`cmp-${row.id}`}
                    type="button"
                    className={buttonClassName(active ? "secondary" : "outline", "sm", "rounded-lg")}
                    onClick={() => toggleComparisonRow(row.id)}
                  >
                    {row.assessment_date}
                  </button>
                );
              })}
            </div>
            {comparisonRows.length < 2 ? (
              <p className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 px-3 py-3 text-small12 font-semibold text-text-muted">
                Selecione pelo menos 2 avaliações para habilitar o comparativo técnico.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-neutral-200/80">
                <table className="min-w-[980px] w-full border-collapse text-small12">
                  <thead className="sticky top-0 z-10 bg-neutral-50/90 backdrop-blur">
                    <tr>
                      <th className="sticky left-0 z-20 border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-text-muted">
                        Métrica
                      </th>
                      {comparisonRows.map((row) => (
                        <th key={`head-${row.id}`} className="border-b border-neutral-200 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-text-muted">
                          {row.assessment_date}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_GROUPS.map((group) => (
                      <React.Fragment key={group.id}>
                        <tr>
                          <td colSpan={comparisonRows.length + 1} className="border-b border-neutral-100 bg-primary/[0.05] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-text-secondary">
                            {group.title}
                          </td>
                        </tr>
                        {group.metrics.map((metric) => (
                          <tr key={`${group.id}-${metric.key}`} className="border-b border-neutral-100/90">
                            <td className="sticky left-0 z-10 bg-white px-3 py-2 font-semibold text-text-secondary">{metric.label}</td>
                            {comparisonRows.map((row, idx) => (
                              <td key={`${metric.key}-${row.id}`} className="px-3 py-2 align-top text-text-primary">
                                <p className="font-semibold">{formatComparisonValue(metric, row)}</p>
                                {metric.numeric ? (
                                  <p className={`mt-0.5 text-[11px] font-semibold ${deltaTone(metric, idx)}`}>
                                    vs ant.: {deltaLabel(metric, idx)}
                                  </p>
                                ) : null}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === "history" && selected ? (
        <Card className="border-neutral-200/55">
          <CardHeader className="border-b border-neutral-100/90 pb-3">
            <p className="text-title16 font-semibold text-text-primary">Detalhe da avaliação selecionada</p>
            <p className="mt-1 text-small12 text-text-secondary">
              Registrada em {selected.assessment_date} · fórmula {selected.body_formula ? FORMULA_LABEL[selected.body_formula] : "—"} · plano ativo no período: {selected.plan_title_snapshot ?? "—"}
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-3 md:grid-cols-3">
              <p className="text-small12 text-text-secondary">IMC: <span className="font-bold text-text-primary">{selected.weight_kg && selected.height_cm ? (selected.weight_kg / Math.pow(selected.height_cm / 100, 2)).toFixed(2) : "—"}</span></p>
              <p className="text-small12 text-text-secondary">RCQ: <span className="font-bold text-text-primary">{selected.waist_cm && selected.hip_cm ? (selected.waist_cm / selected.hip_cm).toFixed(2) : "—"}</span></p>
              <p className="text-small12 text-text-secondary">Cintura/estatura: <span className="font-bold text-text-primary">{selected.waist_cm && selected.height_cm ? (selected.waist_cm / selected.height_cm).toFixed(2) : "—"}</span></p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Composição corporal</p>
                <p className="mt-1 text-small12 text-text-secondary">% gordura: <span className="font-bold text-text-primary">{selected.body_fat_pct ?? "—"}</span> · Massa gorda: <span className="font-bold text-text-primary">{selected.fat_mass_kg ?? "—"} kg</span> · Massa magra: <span className="font-bold text-text-primary">{selected.lean_mass_kg ?? "—"} kg</span></p>
              </div>
              <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Snapshot clínico</p>
                <p className="mt-1 text-small12 text-text-secondary">Sexo: {selected.sex_at_assessment ?? "—"} · Idade: {selected.age_at_assessment ?? "—"} · Atividade: {activityLabel(selected.activity_level_snapshot)} · Objetivo: {goalLabel(selected.goal_snapshot)}</p>
              </div>
            </div>
            {previous ? (
              <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Comparação com avaliação anterior ({previous.assessment_date})</p>
                <p className="mt-1 text-small12 text-text-secondary">
                  Peso: <span className="font-bold text-text-primary">{selected.weight_kg != null && previous.weight_kg != null ? (selected.weight_kg - previous.weight_kg).toFixed(2) : "—"} kg</span> ·
                  Cintura: <span className="font-bold text-text-primary">{selected.waist_cm != null && previous.waist_cm != null ? (selected.waist_cm - previous.waist_cm).toFixed(2) : "—"} cm</span> ·
                  % gordura: <span className="font-bold text-text-primary">{selected.body_fat_pct != null && previous.body_fat_pct != null ? (selected.body_fat_pct - previous.body_fat_pct).toFixed(2) : "—"} pp</span> ·
                  Massa magra: <span className="font-bold text-text-primary">{selected.lean_mass_kg != null && previous.lean_mass_kg != null ? (selected.lean_mass_kg - previous.lean_mass_kg).toFixed(2) : "—"} kg</span>
                </p>
              </div>
            ) : null}
            {selected.notes?.trim() ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Observações</p>
                <p className="mt-1 whitespace-pre-wrap text-small12 text-text-secondary">{selected.notes}</p>
              </div>
            ) : null}
            <p className="text-[10px] font-semibold text-text-muted">Registro atualizado em {formatPatientDateTime(selected.updated_at)}.</p>
          </CardContent>
        </Card>
      ) : null}

      <div>
        <Link href={`/patients/${patientId}`} className={buttonClassName("outline", "md")}>Voltar ao resumo</Link>
      </div>
    </div>
  );
}

