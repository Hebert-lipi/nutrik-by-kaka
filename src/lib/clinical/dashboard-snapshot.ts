import type { ActivityItem } from "@/lib/dashboard-insights";
import type { DraftPatient, DraftPlan } from "@/lib/draft-storage";
import { getLastPlanRevisionAt, getPublishedPlanForPatient } from "@/lib/clinical/patient-plan";

/**
 * Visão única do painel — hoje alimentada por rascunhos locais;
 * futura implementação: substituir por resposta de API/Supabase mantendo este contrato.
 */
export type DashboardSnapshot = {
  source: "local_drafts" | "api";
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

function buildRealActivity(patients: DraftPatient[], plans: DraftPlan[]): ActivityItem[] {
  const items: ActivityItem[] = [];

  patients.slice(0, 8).forEach((p, i) => {
    items.push({
      id: `patient-${p.id}`,
      title: "Paciente no diretório",
      subtitle: p.name,
      time: i === 0 ? "Recente" : "Cadastro",
      variant: "primary",
    });
  });

  plans
    .filter((pl) => pl.status === "published")
    .slice(0, 5)
    .forEach((pl, i) => {
      items.push({
        id: `plan-pub-${pl.id}`,
        title: "Plano publicado",
        subtitle: pl.name,
        time: i === 0 ? "Biblioteca" : "Publicação",
        variant: "yellow",
      });
    });

  return items.slice(0, 12);
}

export function buildDashboardSnapshot(patients: DraftPatient[], plans: DraftPlan[]): DashboardSnapshot {
  const publishedPlans = plans.filter((p) => p.status === "published");
  const activePatients = patients.filter((p) => (p.clinicalStatus ?? "active") === "active").length;

  return {
    source: "local_drafts",
    counts: {
      patients: patients.length,
      plans: plans.length,
      publishedPlans: publishedPlans.length,
      activePatients,
    },
    activity: buildRealActivity(patients, plans),
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
