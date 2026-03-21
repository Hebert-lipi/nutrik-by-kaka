"use client";

import * as React from "react";
import {
  loadDraftPatients,
  loadDraftPlans,
  saveDraftPatients,
  saveDraftPlans,
  type DraftPatient,
  type DraftPlan,
} from "@/lib/draft-storage";

export function useDraftPatients() {
  const [patients, setPatients] = React.useState<DraftPatient[]>([]);

  const refresh = React.useCallback(() => {
    setPatients(loadDraftPatients());
  }, []);

  React.useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("nutrik-draft-storage", on);
    return () => window.removeEventListener("nutrik-draft-storage", on);
  }, [refresh]);

  const addPatient = React.useCallback((input: Omit<DraftPatient, "id">) => {
    const next: DraftPatient[] = [
      ...loadDraftPatients(),
      { ...input, id: crypto.randomUUID() },
    ];
    saveDraftPatients(next);
    setPatients(next);
  }, []);

  const removePatient = React.useCallback((id: string) => {
    const next = loadDraftPatients().filter((p) => p.id !== id);
    saveDraftPatients(next);
    setPatients(next);
  }, []);

  return { patients, addPatient, removePatient, refresh };
}

export function useDraftPlans() {
  const [plans, setPlans] = React.useState<DraftPlan[]>([]);

  const refresh = React.useCallback(() => {
    setPlans(loadDraftPlans());
  }, []);

  React.useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("nutrik-draft-storage", on);
    return () => window.removeEventListener("nutrik-draft-storage", on);
  }, [refresh]);

  const addPlan = React.useCallback((input: Omit<DraftPlan, "id">) => {
    const next: DraftPlan[] = [...loadDraftPlans(), { ...input, id: crypto.randomUUID() }];
    saveDraftPlans(next);
    setPlans(next);
  }, []);

  const removePlan = React.useCallback((id: string) => {
    const next = loadDraftPlans().filter((p) => p.id !== id);
    saveDraftPlans(next);
    setPlans(next);
  }, []);

  const togglePublish = React.useCallback((id: string) => {
    const next: DraftPlan[] = loadDraftPlans().map((p) =>
      p.id === id
        ? { ...p, status: (p.status === "published" ? "draft" : "published") as DraftPlan["status"] }
        : p,
    );
    saveDraftPlans(next);
    setPlans(next);
  }, []);

  return { plans, addPlan, removePlan, togglePublish, refresh };
}

export function useDraftSummary() {
  const [patientsCount, setPatientsCount] = React.useState(0);
  const [plansCount, setPlansCount] = React.useState(0);
  const [publishedCount, setPublishedCount] = React.useState(0);

  const refresh = React.useCallback(() => {
    const p = loadDraftPatients();
    const pl = loadDraftPlans();
    setPatientsCount(p.length);
    setPlansCount(pl.length);
    setPublishedCount(pl.filter((x) => x.status === "published").length);
  }, []);

  React.useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("nutrik-draft-storage", on);
    return () => window.removeEventListener("nutrik-draft-storage", on);
  }, [refresh]);

  return { patientsCount, plansCount, publishedCount, refresh };
}
