/**
 * Registros de adesão do paciente (demonstração local).
 * Estrutura espelha o que virá do backend: por paciente, plano, dia e refeição.
 */

export type MealDifficulty = "none" | "easy" | "medium" | "hard";

export type MealAdherenceEntry = {
  done: boolean;
  difficulty: MealDifficulty;
};

export type PatientAdherenceDay = {
  patientId: string;
  planId: string;
  /** YYYY-MM-DD (fuso local) */
  dateKey: string;
  meals: Record<string, MealAdherenceEntry>;
  dailyNote: string;
};

const STORAGE_KEY = "nutrik.patient.adherence.v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function compositeKey(patientId: string, planId: string, dateKey: string) {
  return `${patientId}::${planId}::${dateKey}`;
}

function todayDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function loadMap(): Record<string, PatientAdherenceDay> {
  if (typeof window === "undefined") return {};
  return safeParse<Record<string, PatientAdherenceDay>>(localStorage.getItem(STORAGE_KEY), {});
}

function saveMap(map: Record<string, PatientAdherenceDay>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event("nutrik-patient-adherence"));
}

export function getTodayDateKey(): string {
  return todayDateKey();
}

export function getAdherenceDay(patientId: string, planId: string, dateKey: string): PatientAdherenceDay {
  const key = compositeKey(patientId, planId, dateKey);
  const map = loadMap();
  return (
    map[key] ?? {
      patientId,
      planId,
      dateKey,
      meals: {},
      dailyNote: "",
    }
  );
}

export function upsertAdherenceDay(next: PatientAdherenceDay) {
  const key = compositeKey(next.patientId, next.planId, next.dateKey);
  const map = loadMap();
  map[key] = next;
  saveMap(map);
}

export function patchMealAdherence(
  patientId: string,
  planId: string,
  dateKey: string,
  mealId: string,
  patch: Partial<MealAdherenceEntry>,
) {
  const day = getAdherenceDay(patientId, planId, dateKey);
  const prev = day.meals[mealId] ?? { done: false, difficulty: "none" as MealDifficulty };
  const meals = { ...day.meals, [mealId]: { ...prev, ...patch } };
  upsertAdherenceDay({ ...day, meals });
}

export function setDailyNote(patientId: string, planId: string, dateKey: string, dailyNote: string) {
  const day = getAdherenceDay(patientId, planId, dateKey);
  upsertAdherenceDay({ ...day, dailyNote });
}
