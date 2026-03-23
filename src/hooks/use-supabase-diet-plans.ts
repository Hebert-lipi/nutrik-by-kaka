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
import { insertDietPlanVersion } from "@/lib/supabase/plan-versions";

export type SavePlanFromBuilderMode = "draft" | "publish";

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

      let publishedStructureForRow: unknown = null;
      if (normalized.status === "published") {
        publishedStructureForRow = draftPlanToStructure(normalized);
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
        published_structure_json: publishedStructureForRow,
      };

      const { error: upErr } = await supabase.from("diet_plans").upsert(row, { onConflict: "id" });
      if (upErr) throw new Error(upErr.message);
      await insertDietPlanVersion(normalized.id, draftPlanToStructure(normalized), userData.user.id);
      await refresh();
    },
    [refresh],
  );

  /**
   * `draft`: grava rascunho. Se o plano já estava publicado, mantém o snapshot do paciente até um `publish`.
   * `publish`: atualiza conteúdo, grava snapshot publicado e (plano de paciente) chama a RPC de publicação.
   */
  const savePlanFromBuilder = React.useCallback(
    async (plan: DraftPlan, mode: SavePlanFromBuilderMode = "draft") => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error(userErr?.message ?? "Não autenticado");

      const normalized = normalizePlan(plan);
      const patientId = normalized.planKind === "patient_plan" ? normalized.linkedPatientId : null;
      const structure = draftPlanToStructure(normalized);

      const { data: existing } = await supabase
        .from("diet_plans")
        .select("published_at,status,published_structure_json,structure_json")
        .eq("id", plan.id)
        .maybeSingle();

      const ex = existing as
        | {
            published_at?: string | null;
            status?: string;
            published_structure_json?: unknown;
            structure_json?: unknown;
          }
        | null;

      let rowStatus: "draft" | "published";
      let publishedAt: string | null = null;
      let publishedStructureJson: unknown = null;

      if (mode === "publish") {
        rowStatus = "published";
        publishedAt =
          typeof ex?.published_at === "string" && ex.published_at ? ex.published_at : new Date().toISOString();
        publishedStructureJson = structure;
      } else if (normalized.status === "draft") {
        rowStatus = "draft";
        publishedAt = null;
        publishedStructureJson = null;
      } else if (ex?.status === "published" && normalized.status === "published") {
        rowStatus = "published";
        publishedAt = typeof ex.published_at === "string" ? ex.published_at : new Date().toISOString();
        publishedStructureJson =
          ex.published_structure_json !== undefined && ex.published_structure_json !== null
            ? ex.published_structure_json
            : ex.structure_json ?? structure;
      } else {
        rowStatus = normalized.status;
        publishedAt =
          normalized.status === "published"
            ? typeof ex?.published_at === "string" && ex.published_at
              ? ex.published_at
              : new Date().toISOString()
            : null;
        publishedStructureJson = normalized.status === "published" ? structure : null;
      }

      const row = {
        id: normalized.id,
        nutritionist_user_id: userData.user.id,
        patient_id: patientId,
        title: normalized.name.trim(),
        description: normalized.description.trim(),
        status: rowStatus,
        structure_json: structure,
        published_at: publishedAt,
        published_structure_json: publishedStructureJson,
      };

      const { error: upErr } = await supabase.from("diet_plans").upsert(row, { onConflict: "id" });
      if (upErr) throw new Error(upErr.message);

      if (mode === "publish" && normalized.planKind === "patient_plan" && patientId) {
        const { data: rpcData, error: rpcErr } = await supabase.rpc("publish_diet_plan_for_patient", {
          p_plan_id: normalized.id,
        });
        if (rpcErr) throw new Error(rpcErr.message);
        const payload = rpcData as { ok?: boolean; error?: string } | null;
        if (!payload?.ok) {
          throw new Error("Não foi possível publicar o plano para o paciente.");
        }
      }

      await insertDietPlanVersion(normalized.id, structure, userData.user.id);
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
      if (
        nextStatus === "published" &&
        current.planKind === "patient_plan" &&
        !current.linkedPatientId
      ) {
        throw new Error("Selecione um paciente neste plano no editor antes de publicar.");
      }

      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? null;

      if (nextStatus === "published") {
        if (current.planKind === "patient_plan" && current.linkedPatientId) {
          const { data: rpcData, error: rpcErr } = await supabase.rpc("publish_diet_plan_for_patient", {
            p_plan_id: id,
          });
          if (rpcErr) throw new Error(rpcErr.message);
          const payload = rpcData as { ok?: boolean; error?: string } | null;
          if (!payload?.ok) {
            const code = payload?.error ?? "unknown";
            const msg =
              code === "plan_requires_patient"
                ? "Este plano precisa estar vinculado a um paciente para publicar."
                : code === "forbidden"
                  ? "Sem permissão para publicar este plano."
                  : code === "plan_not_found"
                    ? "Plano não encontrado."
                    : "Não foi possível publicar o plano.";
            throw new Error(msg);
          }
        } else {
          const { data: rowSnap } = await supabase.from("diet_plans").select("structure_json").eq("id", id).maybeSingle();
          const { error: upErr } = await supabase
            .from("diet_plans")
            .update({
              status: "published",
              published_at: new Date().toISOString(),
              published_structure_json: rowSnap?.structure_json ?? null,
            })
            .eq("id", id);
          if (upErr) throw new Error(upErr.message);
        }
      } else {
        const { error: upErr } = await supabase
          .from("diet_plans")
          .update({
            status: "draft",
            published_at: null,
            published_structure_json: null,
          })
          .eq("id", id);
        if (upErr) throw new Error(upErr.message);
      }

      const { data: row } = await supabase.from("diet_plans").select("*").eq("id", id).maybeSingle();
      if (row) {
        const pl = dietPlanRowToDraftPlan(row as DietPlanRow);
        await insertDietPlanVersion(id, draftPlanToStructure(pl), uid);
      }
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
