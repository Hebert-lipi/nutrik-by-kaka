"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import type { DraftPlan } from "@/lib/draft-storage";
import { normalizePlan } from "@/lib/draft-storage";
import {
  DIET_PLAN_SELECT_FULL,
  DIET_PLAN_SELECT_LIST,
  dietPlanListRowToDraftPlan,
  dietPlanRowToDraftPlan,
  draftPlanToStructure,
  type DietPlanListRow,
  type DietPlanRow,
} from "@/lib/supabase/plan-mapper";
import { insertDietPlanVersion } from "@/lib/supabase/plan-versions";
import { measurePerf } from "@/lib/perf/perf-metrics";

/** Não falha o salvamento se só o histórico de versões falhar — `diet_plans` já foi gravado. */
async function safeInsertDietPlanVersion(
  planId: string,
  structure: ReturnType<typeof draftPlanToStructure>,
  userId: string | null,
) {
  try {
    await insertDietPlanVersion(planId, structure, userId);
  } catch (e) {
    console.error(
      "[Nutrik] diet_plan_versions: não foi possível registrar revisão; o conteúdo do plano em diet_plans foi salvo.",
      e,
    );
  }
}

const PLANS_CACHE_TTL_MS = 5 * 60_000;
let plansCache: { data: DraftPlan[]; fetchedAt: number } | null = null;
let inflightPlansRefresh: Promise<void> | null = null;
let plansLoadingState = true;
let plansErrorState: string | null = null;
let plansBootstrapped = false;
let plansAuthSub: { unsubscribe: () => void } | null = null;
const plansSubscribers = new Set<(state: { plans: DraftPlan[]; loading: boolean; error: string | null }) => void>();

function plansSnapshot() {
  return {
    plans: plansCache?.data ?? [],
    loading: plansLoadingState,
    error: plansErrorState,
  };
}

function emitPlansState() {
  const snap = plansSnapshot();
  for (const cb of plansSubscribers) cb(snap);
}

async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.user?.id ?? null;
}

export type SavePlanFromBuilderMode = "draft" | "publish";

export function useSupabaseDietPlans() {
  const [state, setState] = React.useState(() => plansSnapshot());

  const refresh = React.useCallback(async (force = false) => {
    const cached = plansCache;
    const cacheFresh = Boolean(!force && cached && Date.now() - cached.fetchedAt < PLANS_CACHE_TTL_MS);
    if (cached && !force) {
      plansLoadingState = false;
      emitPlansState();
      if (cacheFresh) return;
    }
    if (inflightPlansRefresh && !force) {
      // Evita duplicar chamadas em montagens paralelas.
      return;
    }
    const run = async () => {
      if (!plansCache || force) {
        plansLoadingState = true;
        emitPlansState();
      }
      plansErrorState = null;
      const userId = await getCurrentUserId();
      if (!userId) {
        plansCache = { data: [], fetchedAt: Date.now() };
        plansLoadingState = false;
        emitPlansState();
        return;
      }

      const { data, error: qErr } = await measurePerf(
        "dietPlans.refresh.query",
        () =>
          supabase
            .from("diet_plans")
            .select(DIET_PLAN_SELECT_LIST)
            .eq("nutritionist_user_id", userId)
            .order("updated_at", { ascending: false }),
        force ? "force" : "cached-miss",
      );

      if (qErr) {
        plansErrorState = qErr.message;
        plansCache = { data: [], fetchedAt: Date.now() };
      } else {
        const mapped = (data as DietPlanListRow[]).map(dietPlanListRowToDraftPlan);
        plansCache = { data: mapped, fetchedAt: Date.now() };
      }
      plansLoadingState = false;
      emitPlansState();
    };
    inflightPlansRefresh = run().finally(() => {
      inflightPlansRefresh = null;
    });
    await inflightPlansRefresh;
  }, []);

  React.useEffect(() => {
    const cb = (next: { plans: DraftPlan[]; loading: boolean; error: string | null }) => setState(next);
    plansSubscribers.add(cb);
    cb(plansSnapshot());

    if (!plansBootstrapped) {
      plansBootstrapped = true;
      void refresh();
    }
    if (!plansAuthSub) {
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
          void refresh(true);
        }
      });
      plansAuthSub = sub.subscription;
    }

    return () => {
      plansSubscribers.delete(cb);
    };
  }, [refresh]);

  const upsertPlan = React.useCallback(
    async (plan: DraftPlan) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Não autenticado");

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
        nutritionist_user_id: userId,
        patient_id: patientId,
        title: normalized.name.trim(),
        description: normalized.description.trim(),
        status: normalized.status,
        structure_json: draftPlanToStructure(normalized),
        published_at: publishedAt,
        published_structure_json: publishedStructureForRow,
      };

      const { error: upErr } = await measurePerf("dietPlans.upsert", () => supabase.from("diet_plans").upsert(row, { onConflict: "id" }));
      if (upErr) throw new Error(upErr.message);
      await safeInsertDietPlanVersion(normalized.id, draftPlanToStructure(normalized), userId);
      await refresh(true);
    },
    [refresh],
  );

  /**
   * `draft`: grava rascunho. Se o plano já estava publicado, mantém o snapshot do paciente até um `publish`.
   * `publish`: atualiza conteúdo, grava snapshot publicado e (plano de paciente) chama a RPC de publicação.
   */
  const savePlanFromBuilder = React.useCallback(
    async (plan: DraftPlan, mode: SavePlanFromBuilderMode = "draft") => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Não autenticado");

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
        nutritionist_user_id: userId,
        patient_id: patientId,
        title: normalized.name.trim(),
        description: normalized.description.trim(),
        status: rowStatus,
        structure_json: structure,
        published_at: publishedAt,
        published_structure_json: publishedStructureJson,
      };

      const { error: upErr } = await measurePerf("dietPlans.saveFromBuilder.upsert", () => supabase.from("diet_plans").upsert(row, { onConflict: "id" }), mode);
      if (upErr) throw new Error(upErr.message);

      if (mode === "publish" && normalized.planKind === "patient_plan" && patientId) {
        const { data: rpcData, error: rpcErr } = await measurePerf(
          "dietPlans.publish.rpc",
          () =>
            supabase.rpc("publish_diet_plan_for_patient", {
              p_plan_id: normalized.id,
            }),
          "saveFromBuilder",
        );
        if (rpcErr) throw new Error(rpcErr.message);
        const payload = rpcData as { ok?: boolean; error?: string } | null;
        if (!payload?.ok) {
          throw new Error("Não foi possível publicar o plano para o paciente.");
        }
      }

      await safeInsertDietPlanVersion(normalized.id, structure, userId);
      await refresh(true);
    },
    [refresh],
  );

  const fetchPlanById = React.useCallback(async (id: string): Promise<DraftPlan | null> => {
    const { data, error: qErr } = await measurePerf(
      "dietPlans.fetchById.query",
        () =>
          supabase
            .from("diet_plans")
            .select(DIET_PLAN_SELECT_FULL)
            .eq("id", id)
            .maybeSingle(),
      id,
    );
    if (qErr) {
      console.error("[Nutrik] fetchPlanById:", qErr.message);
      return null;
    }
    if (!data) return null;
    return dietPlanRowToDraftPlan(data as DietPlanRow);
  }, []);

  const removePlan = React.useCallback(
    async (id: string) => {
      const { error: delErr } = await supabase.from("diet_plans").delete().eq("id", id);
      if (delErr) throw new Error(delErr.message);
      await refresh(true);
    },
    [refresh],
  );

  const togglePublish = React.useCallback(
    async (id: string) => {
      const current = state.plans.find((p) => p.id === id);
      if (!current) return;
      const nextStatus = current.status === "published" ? "draft" : "published";
      if (
        nextStatus === "published" &&
        current.planKind === "patient_plan" &&
        !current.linkedPatientId
      ) {
        throw new Error("Selecione um paciente neste plano no editor antes de publicar.");
      }

      const uid = await getCurrentUserId();

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

      const { data: row } = await supabase
        .from("diet_plans")
        .select(DIET_PLAN_SELECT_FULL)
        .eq("id", id)
        .maybeSingle();
      if (row) {
        const pl = dietPlanRowToDraftPlan(row as DietPlanRow);
        await insertDietPlanVersion(id, draftPlanToStructure(pl), uid);
      }
      await refresh(true);
    },
    [state.plans, refresh],
  );

  return {
    plans: state.plans,
    loading: state.loading,
    error: state.error,
    upsertPlan,
    savePlanFromBuilder,
    fetchPlanById,
    removePlan,
    togglePublish,
    refresh,
  };
}
