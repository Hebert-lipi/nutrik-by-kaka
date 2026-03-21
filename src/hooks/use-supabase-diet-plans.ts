"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import type { DraftPlan } from "@/lib/draft-storage";
import { normalizePlan } from "@/lib/draft-storage";
import {
  dietPlanRowToDraftPlan,
  draftPlanToStructure,
  type DietPlanRow,
} from "@/lib/supabase/plan-mapper";

export function useSupabaseDietPlans() {
  const [plans, setPlans] = React.useState<DraftPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setError(null);
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      setPlans([]);
      setLoading(false);
      if (userErr) setError(userErr.message);
      return;
    }

    const { data, error: qErr } = await supabase
      .from("diet_plans")
      .select("*")
      .eq("nutritionist_user_id", userData.user.id)
      .order("updated_at", { ascending: false });

    if (qErr) {
      setError(qErr.message);
      setPlans([]);
    } else {
      setPlans((data as DietPlanRow[]).map(dietPlanRowToDraftPlan));
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const upsertPlan = React.useCallback(
    async (plan: DraftPlan) => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error(userErr?.message ?? "Não autenticado");

      const normalized = normalizePlan(plan);
      const patientId = normalized.planKind === "patient_plan" ? normalized.linkedPatientId : null;

      let publishedAt: string | null = null;
      if (normalized.status === "published") {
        const { data: existing } = await supabase.from("diet_plans").select("published_at").eq("id", plan.id).maybeSingle();
        const prev =
          existing && typeof (existing as { published_at?: string | null }).published_at === "string"
            ? (existing as { published_at: string }).published_at
            : null;
        publishedAt = prev ?? new Date().toISOString();
      }

      const row = {
        id: normalized.id,
        nutritionist_user_id: userData.user.id,
        patient_id: patientId,
        title: normalized.name.trim(),
        description: normalized.description.trim(),
        status: normalized.status,
        structure_json: draftPlanToStructure(normalized),
        published_at: publishedAt,
      };

      const { error: upErr } = await supabase.from("diet_plans").upsert(row, { onConflict: "id" });
      if (upErr) throw new Error(upErr.message);
      await refresh();
    },
    [refresh],
  );

  /**
   * Persistência do construtor após revisão — mantém published_at se o plano já estava publicado.
   */
  const savePlanFromBuilder = React.useCallback(
    async (plan: DraftPlan) => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error(userErr?.message ?? "Não autenticado");

      const normalized = normalizePlan(plan);
      const patientId = normalized.planKind === "patient_plan" ? normalized.linkedPatientId : null;

      let publishedAt: string | null = null;
      if (normalized.status === "published") {
        const { data: existing } = await supabase.from("diet_plans").select("published_at").eq("id", plan.id).maybeSingle();
        const prev =
          existing && typeof (existing as { published_at?: string | null }).published_at === "string"
            ? (existing as { published_at: string }).published_at
            : null;
        publishedAt = prev ?? new Date().toISOString();
      }

      const row = {
        id: normalized.id,
        nutritionist_user_id: userData.user.id,
        patient_id: patientId,
        title: normalized.name.trim(),
        description: normalized.description.trim(),
        status: normalized.status,
        structure_json: draftPlanToStructure(normalized),
        published_at: publishedAt,
      };

      const { error: upErr } = await supabase.from("diet_plans").upsert(row, { onConflict: "id" });
      if (upErr) throw new Error(upErr.message);
      await refresh();
    },
    [refresh],
  );

  const fetchPlanById = React.useCallback(async (id: string): Promise<DraftPlan | null> => {
    const { data, error: qErr } = await supabase.from("diet_plans").select("*").eq("id", id).maybeSingle();
    if (qErr || !data) return null;
    return dietPlanRowToDraftPlan(data as DietPlanRow);
  }, []);

  const removePlan = React.useCallback(
    async (id: string) => {
      const { error: delErr } = await supabase.from("diet_plans").delete().eq("id", id);
      if (delErr) throw new Error(delErr.message);
      await refresh();
    },
    [refresh],
  );

  const togglePublish = React.useCallback(
    async (id: string) => {
      const current = plans.find((p) => p.id === id);
      if (!current) return;
      const nextStatus = current.status === "published" ? "draft" : "published";
      const { error: upErr } = await supabase
        .from("diet_plans")
        .update({
          status: nextStatus,
          published_at: nextStatus === "published" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (upErr) throw new Error(upErr.message);
      await refresh();
    },
    [plans, refresh],
  );

  return {
    plans,
    loading,
    error,
    upsertPlan,
    savePlanFromBuilder,
    fetchPlanById,
    removePlan,
    togglePublish,
    refresh,
  };
}
