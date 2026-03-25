import type { DraftPlanMeal } from "@/lib/draft-storage";

export type DayMealStatus = "completed" | "pending" | "overdue";

export const SCHEDULE_GRACE_MINUTES = 15;

export function parseMealTimeToMinutes(raw: string): number | null {
  const t = raw.trim();
  const m = t.match(/^(\d{1,2})\s*[:hH]\s*(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export function minutesFromDate(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function mealDayStatus(completed: boolean, mealTimeRaw: string, nowMinutes: number): DayMealStatus {
  if (completed) return "completed";
  const sched = parseMealTimeToMinutes(mealTimeRaw);
  if (sched === null) return "pending";
  if (nowMinutes > sched + SCHEDULE_GRACE_MINUTES) return "overdue";
  return "pending";
}

export function mealDayStatusForView(
  completed: boolean,
  mealTimeRaw: string,
  nowMinutes: number,
  viewIsToday: boolean,
): DayMealStatus {
  if (completed) return "completed";
  if (!viewIsToday) return "pending";
  return mealDayStatus(completed, mealTimeRaw, nowMinutes);
}

export const STATUS_LABEL: Record<DayMealStatus, string> = {
  completed: "Concluído",
  pending: "Pendente",
  overdue: "Atrasado",
};

export function summarizeDayMeals(
  meals: DraftPlanMeal[],
  mealState: Record<string, { completed?: boolean } | undefined>,
  nowMinutes: number,
  viewIsToday: boolean,
  enabled: boolean,
): {
  completedCount: number;
  pendingCount: number;
  overdueCount: number;
  progressPct: number;
} {
  let completed = 0;
  let pending = 0;
  let overdue = 0;
  for (const m of meals) {
    const done = Boolean(enabled && mealState[m.id]?.completed);
    const st = mealDayStatusForView(done, m.time, nowMinutes, viewIsToday);
    if (st === "completed") completed += 1;
    else if (st === "pending") pending += 1;
    else overdue += 1;
  }
  const n = meals.length;
  const progressPct = n ? Math.round((completed / n) * 100) : 0;
  return { completedCount: completed, pendingCount: pending, overdueCount: overdue, progressPct };
}
