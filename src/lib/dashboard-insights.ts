import type { DraftPatient, DraftPlan } from "@/lib/draft-storage";

/** Série base (simulada) — último ponto é ajustado com cadastros reais. */
const BASE_PATIENT_SERIES = [14, 16, 15, 18, 20, 22, 24];

const DAY_LABELS_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function getPatientSeries7d(realPatientCount: number): { labels: string[]; values: number[] } {
  const values = BASE_PATIENT_SERIES.map((v, i) =>
    i === BASE_PATIENT_SERIES.length - 1 ? Math.max(v, v + realPatientCount) : v,
  );
  return { labels: DAY_LABELS_SHORT, values };
}

export function getNewPatientsBars(realPatientCount: number): number[] {
  const bump = Math.min(5, realPatientCount + 1);
  return [2, 3, 2, 4, 3, 5, bump];
}

export type ActivityItem = {
  id: string;
  title: string;
  subtitle?: string;
  time: string;
  variant: "primary" | "yellow" | "neutral" | "orange";
};

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "mock-1",
    title: "Meta semanal de acompanhamento",
    subtitle: "3 pacientes com check-in pendente",
    time: "Há 2 h",
    variant: "yellow",
  },
  {
    id: "mock-2",
    title: "Sugestão de cardápio",
    subtitle: "Almoço rico em proteína para perfil ativo",
    time: "Ontem",
    variant: "neutral",
  },
  {
    id: "mock-3",
    title: "Relatório de adesão",
    subtitle: "Visualização disponível na área clínica",
    time: "2 dias",
    variant: "orange",
  },
];

export function buildActivityFeed(patients: DraftPatient[], plans: DraftPlan[]): ActivityItem[] {
  const fromPatients: ActivityItem[] = patients.slice(0, 3).map((p, i) => ({
    id: `p-${p.id}`,
    title: "Paciente cadastrado",
    subtitle: p.name,
    time: i === 0 ? "Agora" : i === 1 ? "Hoje" : "Recente",
    variant: "primary" as const,
  }));

  const fromPlans: ActivityItem[] = plans.slice(0, 2).map((pl, i) => ({
    id: `pl-${pl.id}`,
    title: pl.status === "published" ? "Plano publicado" : "Plano em rascunho",
    subtitle: pl.name,
    time: i === 0 ? "Hoje" : "Recente",
    variant: pl.status === "published" ? ("primary" as const) : ("yellow" as const),
  }));

  const merged = [...fromPatients, ...fromPlans, ...MOCK_ACTIVITY];
  return merged.slice(0, 8);
}

export function growthLabel(realPatientCount: number): { text: string; positive: boolean } {
  if (realPatientCount === 0) {
    return { text: "+0% vs. período anterior", positive: true };
  }
  const pct = Math.min(24, 8 + realPatientCount * 3);
  return { text: `+${pct}% vs. período anterior`, positive: true };
}

export function newPatientsThisWeekLabel(count: number): string {
  if (count === 0) return "Nenhum novo nesta semana (simulação)";
  return `${count} novo(s) nesta semana`;
}
