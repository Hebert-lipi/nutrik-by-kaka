import { activityLabel, goalLabel } from "@/lib/clinical/assessment-math";
import type { PatientAssessmentRow } from "@/lib/supabase/patient-assessments";

export type AssessmentComparisonMetric = {
  key: string;
  label: string;
  unit?: string;
  getValue: (row: PatientAssessmentRow) => number | string | null;
  numeric?: boolean;
  deltaUnit?: string;
};

export type AssessmentComparisonGroup = {
  id: string;
  title: string;
  metrics: AssessmentComparisonMetric[];
};

const FORMULA_LABEL: Record<string, string> = {
  jackson_pollock_3: "Jackson & Pollock (3 dobras)",
  jackson_pollock_7: "Jackson & Pollock (7 dobras)",
  durnin_womersley: "Durnin-Womersley",
  slaughter: "Slaughter",
  petroski: "Petroski",
};

function bmi(row: PatientAssessmentRow): number | null {
  if (!row.weight_kg || !row.height_cm) return null;
  return row.weight_kg / Math.pow(row.height_cm / 100, 2);
}

function rcq(row: PatientAssessmentRow): number | null {
  if (!row.waist_cm || !row.hip_cm) return null;
  return row.waist_cm / row.hip_cm;
}

function whtr(row: PatientAssessmentRow): number | null {
  if (!row.waist_cm || !row.height_cm) return null;
  return row.waist_cm / row.height_cm;
}

export const COMPARISON_GROUPS: AssessmentComparisonGroup[] = [
  {
    id: "general",
    title: "Dados gerais",
    metrics: [
      { key: "assessment_date", label: "Data da avaliação", getValue: (r) => r.assessment_date },
      { key: "weight_kg", label: "Peso", unit: "kg", getValue: (r) => r.weight_kg, numeric: true },
      { key: "height_cm", label: "Altura", unit: "cm", getValue: (r) => r.height_cm, numeric: true },
      { key: "bmi", label: "IMC", getValue: (r) => bmi(r), numeric: true },
      { key: "rcq", label: "RCQ", getValue: (r) => rcq(r), numeric: true },
      { key: "whtr", label: "Cintura/estatura", getValue: (r) => whtr(r), numeric: true },
      { key: "goal_snapshot", label: "Objetivo", getValue: (r) => goalLabel(r.goal_snapshot) },
      { key: "age_at_assessment", label: "Idade na avaliação", unit: "anos", getValue: (r) => r.age_at_assessment, numeric: true },
      { key: "activity_level_snapshot", label: "Atividade", getValue: (r) => activityLabel(r.activity_level_snapshot) },
    ],
  },
  {
    id: "composition",
    title: "Composição corporal",
    metrics: [
      { key: "body_formula", label: "Fórmula", getValue: (r) => (r.body_formula ? FORMULA_LABEL[r.body_formula] ?? r.body_formula : null) },
      { key: "body_density", label: "Densidade corporal", getValue: (r) => r.body_density, numeric: true },
      { key: "body_fat_pct", label: "% gordura", unit: "%", deltaUnit: "pp", getValue: (r) => r.body_fat_pct, numeric: true },
      { key: "fat_mass_kg", label: "Massa gorda", unit: "kg", getValue: (r) => r.fat_mass_kg, numeric: true },
      { key: "lean_mass_kg", label: "Massa magra", unit: "kg", getValue: (r) => r.lean_mass_kg, numeric: true },
    ],
  },
  {
    id: "circumferences",
    title: "Circunferências",
    metrics: [
      { key: "waist_cm", label: "Cintura", unit: "cm", getValue: (r) => r.waist_cm, numeric: true },
      { key: "hip_cm", label: "Quadril", unit: "cm", getValue: (r) => r.hip_cm, numeric: true },
      { key: "abdomen_cm", label: "Abdômen", unit: "cm", getValue: (r) => r.abdomen_cm, numeric: true },
      { key: "chest_cm", label: "Tórax", unit: "cm", getValue: (r) => r.chest_cm, numeric: true },
      { key: "arm_cm", label: "Braço", unit: "cm", getValue: (r) => r.arm_cm, numeric: true },
      { key: "thigh_cm", label: "Coxa", unit: "cm", getValue: (r) => r.thigh_cm, numeric: true },
      { key: "calf_cm", label: "Panturrilha", unit: "cm", getValue: (r) => r.calf_cm, numeric: true },
    ],
  },
  {
    id: "skinfolds",
    title: "Dobras cutâneas",
    metrics: [
      { key: "triceps_mm", label: "Tríceps", unit: "mm", getValue: (r) => r.triceps_mm, numeric: true },
      { key: "biceps_mm", label: "Bíceps", unit: "mm", getValue: (r) => r.biceps_mm, numeric: true },
      { key: "subscapular_mm", label: "Subescapular", unit: "mm", getValue: (r) => r.subscapular_mm, numeric: true },
      { key: "suprailiac_mm", label: "Supra-ilíaca", unit: "mm", getValue: (r) => r.suprailiac_mm, numeric: true },
      { key: "abdominal_mm", label: "Abdominal", unit: "mm", getValue: (r) => r.abdominal_mm, numeric: true },
      { key: "chest_skinfold_mm", label: "Peitoral", unit: "mm", getValue: (r) => r.chest_skinfold_mm, numeric: true },
      { key: "midaxillary_mm", label: "Axilar média", unit: "mm", getValue: (r) => r.midaxillary_mm, numeric: true },
      { key: "thigh_skinfold_mm", label: "Coxa (dobra)", unit: "mm", getValue: (r) => r.thigh_skinfold_mm, numeric: true },
      { key: "calf_skinfold_mm", label: "Panturrilha (dobra)", unit: "mm", getValue: (r) => r.calf_skinfold_mm, numeric: true },
    ],
  },
  {
    id: "notes",
    title: "Observações clínicas",
    metrics: [{ key: "notes", label: "Observações", getValue: (r) => r.notes?.trim() || null }],
  },
];

export function formatComparisonValue(metric: AssessmentComparisonMetric, row: PatientAssessmentRow): string {
  const raw = metric.getValue(row);
  if (raw == null || raw === "") return "—";
  if (!metric.numeric) return String(raw);
  const n = Number(raw);
  if (!Number.isFinite(n)) return "—";
  const fixed = Math.abs(n) >= 100 ? n.toFixed(1) : n.toFixed(2);
  const normalized = fixed.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  return metric.unit ? `${normalized} ${metric.unit}` : normalized;
}

export function getNumericComparisonValue(metric: AssessmentComparisonMetric, row: PatientAssessmentRow): number | null {
  if (!metric.numeric) return null;
  const raw = metric.getValue(row);
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

