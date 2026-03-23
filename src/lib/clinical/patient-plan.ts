import type { DraftPatient, DraftPlan, DraftPlanMeal } from "@/lib/draft-storage";

/** Refeições como o paciente vê (snapshot publicado), ou o plano inteiro se ainda não há snapshot separado. */
export function getPatientFacingMeals(plan: DraftPlan): DraftPlanMeal[] {
  if (plan.status !== "published") return plan.meals;
  if (plan.portalMeals && plan.portalMeals.length > 0) return plan.portalMeals;
  return plan.meals;
}

export function getPlansLinkedToPatient(patientId: string, plans: DraftPlan[]): DraftPlan[] {
  return plans.filter((p) => p.linkedPatientId === patientId);
}

/** Plano publicado atualmente vinculado ao paciente (um por paciente neste modelo). */
export function getPublishedPlanForPatient(patientId: string, plans: DraftPlan[]): DraftPlan | null {
  return (
    plans.find((p) => p.linkedPatientId === patientId && p.status === "published" && p.planKind === "patient_plan") ??
    plans.find((p) => p.linkedPatientId === patientId && p.status === "published") ??
    null
  );
}

export function findPatientByEmail(patients: DraftPatient[], email: string): DraftPatient | null {
  const e = email.trim().toLowerCase();
  return patients.find((p) => p.email.trim().toLowerCase() === e) ?? null;
}

/** Última revisão salva no plano (para “última atualização da dieta”). */
export function getLastPlanRevisionAt(plan: DraftPlan | null): string | null {
  if (!plan?.revisionHistory?.length) return null;
  const last = plan.revisionHistory[plan.revisionHistory.length - 1];
  return last?.savedAt ?? null;
}
