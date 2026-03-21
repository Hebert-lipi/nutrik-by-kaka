export type DraftPatient = {
  id: string;
  name: string;
  email: string;
  planLabel: string;
};

export type DraftPlan = {
  id: string;
  name: string;
  status: "draft" | "published";
  patientCount: number;
};

const PATIENTS_KEY = "nutrik.draft.patients.v1";
const PLANS_KEY = "nutrik.draft.plans.v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadDraftPatients(): DraftPatient[] {
  if (typeof window === "undefined") return [];
  return safeParse<DraftPatient[]>(localStorage.getItem(PATIENTS_KEY), []);
}

export function saveDraftPatients(list: DraftPatient[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("nutrik-draft-storage"));
}

export function loadDraftPlans(): DraftPlan[] {
  if (typeof window === "undefined") return [];
  return safeParse<DraftPlan[]>(localStorage.getItem(PLANS_KEY), []);
}

export function saveDraftPlans(list: DraftPlan[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLANS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("nutrik-draft-storage"));
}
