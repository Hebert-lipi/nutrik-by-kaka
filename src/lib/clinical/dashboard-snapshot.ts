import type { ActivityItem } from "@/lib/dashboard-insights";
import type { DraftPatient, DraftPlan } from "@/lib/draft-storage";
import { getLastPlanRevisionAt, getPublishedPlanForPatient } from "@/lib/clinical/patient-plan";

export type DietPlanVersionEvent = {
  id: string;
  plan_id: string;
  created_at: string;
};

function formatActivityTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * Visão única do painel — alimentada por Supabase (MVP).
 */
export type DashboardSnapshot = {
  source: "supabase" | "local_drafts" | "api";
  counts: {
    patients: number;
    plans: number;
    publishedPlans: number;
    activePatients: number;
  };
  /** Atividade derivada apenas de dados reais do diretório (sem texto fictício). */
  activity: ActivityItem[];
  recentPatients: DraftPatient[];
  recentPlans: DraftPlan[];
  /** Indicadores que dependem de integração (telemetria, agenda, etc.). */
  operational: {
    checkInsToday: number | null;
    plansOpenedToday: number | null;
    labels: { checkIns: string; plansOpened: string };
  };
  /** Séries para gráficos — null até haver endpoint histórico. */
  charts: {
    enabled: boolean;
    patientTrendCaption: string | null;
  };
};

function buildRealActivity(
  patients: DraftPatient[],
  plans: DraftPlan[],
  versionEvents: DietPlanVersionEvent[] | undefined,
): ActivityItem[] {
  const items: ActivityItem[] = [];

  (versionEvents ?? []).slice(0, 12).forEach((v) => {
    const name = plans.find((p) => p.id === v.plan_id)?.name ?? "Plano";
    items.push({
      id: `ver-${v.id}`,
      title: "Plano atualizado (nova versão)",
      subtitle: name,
      time: formatActivityTime(v.created_at),
      variant: "yellow",
    });
  });

  const patientsSorted = [...patients].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  patientsSorted.slice(0, 6).forEach((p) => {
    items.push({
      id: `patient-${p.id}`,
      title: "Paciente cadastrado",
      subtitle: p.name,
      time: p.createdAt ? formatActivityTime(p.createdAt) : "Cadastro",
      variant: "primary",
    });
  });

  plans
    .filter((pl) => pl.status === "published")
    .sort((a, b) => {
      const pa = a.name;
      const pb = b.name;
      return pa.localeCompare(pb);
    })
    .slice(0, 4)
    .forEach((pl) => {
      items.push({
        id: `plan-pub-${pl.id}`,
        title: "Plano publicado na biblioteca",
        subtitle: pl.name,
        time: "Ativo",
        variant: "yellow",
      });
    });

  return items.slice(0, 16);
}

export function buildDashboardSnapshot(
  patients: DraftPatient[],
  plans: DraftPlan[],
  versionEvents?: DietPlanVersionEvent[],
): DashboardSnapshot {
  const publishedPlans = plans.filter((p) => p.status === "published");
  const activePatients = patients.filter((p) => (p.clinicalStatus ?? "active") === "active").length;

  return {
    source: "supabase",
    counts: {
      patients: patients.length,
      plans: plans.length,
      publishedPlans: publishedPlans.length,
      activePatients,
    },
    activity: buildRealActivity(patients, plans, versionEvents),
    recentPatients: patients.slice(0, 5),
    recentPlans: plans.slice(0, 4),
    operational: {
      checkInsToday: null,
      plansOpenedToday: null,
      labels: {
        checkIns: "Check-ins hoje",
        plansOpened: "Planos abertos hoje",
      },
    },
    charts: {
      enabled: false,
      patientTrendCaption: null,
    },
  };
}

export function patientDietSummary(patient: DraftPatient, plans: DraftPlan[]) {
  const published = getPublishedPlanForPatient(patient.id, plans);
  const drafts = plans.filter((p) => p.linkedPatientId === patient.id && p.status === "draft");
  return {
    publishedPlan: published,
    draftCount: drafts.length,
    lastDietUpdateAt: getLastPlanRevisionAt(published),
  };
}
