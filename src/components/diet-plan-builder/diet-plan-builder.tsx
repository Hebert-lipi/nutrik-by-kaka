"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { DraftPlan } from "@/lib/draft-storage";
import { createEmptyMeal, normalizePlan, snapshotPlanForHistory } from "@/lib/draft-storage";
import {
  addGroupToMeal,
  cloneEntirePlan,
  createNewPlanSkeleton,
  duplicateMealInPlan,
  moveMeal,
  removeMealFromPlan,
  reorderMeals,
} from "@/lib/diet-plan-factory";
import { getExampleMeals } from "@/lib/diet-plan-example";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";
import { useSupabaseDietPlans } from "@/hooks/use-supabase-diet-plans";
import { supabase } from "@/lib/supabaseClient";
import { PageHeader } from "@/components/layout/dashboard/page-header";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlanMetaSection } from "./plan-meta-section";
import { MealSection } from "./meal-section";
import { PlanPreviewModal } from "./plan-preview-modal";
import { PlanBuilderContextStrip } from "./plan-builder-context-strip";
import { PlanNutritionSummary } from "./plan-nutrition-summary";
import { BuilderFeedbackBanner, type BuilderFeedback } from "./builder-feedback-banner";
import { NutritionIntelligencePanel } from "./nutrition-intelligence-panel";
import { fetchPlanVersions, type DietPlanVersionRow } from "@/lib/supabase/plan-versions";
import { profileFromPatient, usePlanNutritionEngine } from "@/hooks/use-plan-nutrition-engine";
import { measurePerf } from "@/lib/perf/perf-metrics";

const DND_MEAL_MIME = "application/x-nutrik-meal-id";
const FALLBACK_PLAN_FOR_HOOKS = normalizePlan({});

const EDITOR_RECOVERY_PREFIX = "nutrik-editor-recover-v1:";
const EDITOR_RECOVERY_TTL_MS = 12 * 60 * 1000;

function editorRecoveryKey(planId: string) {
  return `${EDITOR_RECOVERY_PREFIX}${planId}`;
}

function persistEditorRecovery(plan: DraftPlan) {
  const payload = JSON.stringify({ savedAt: Date.now(), plan });
  const key = editorRecoveryKey(plan.id);
  try {
    sessionStorage.setItem(key, payload);
    return;
  } catch {
    /* quota / private mode / políticas IT */
  }
  try {
    localStorage.setItem(key, payload);
  } catch {
    /* ignore */
  }
}

function parseRecoveryPayload(raw: string, planId: string, store: Storage, key: string): DraftPlan | null {
  try {
    const o = JSON.parse(raw) as { savedAt?: number; plan?: unknown };
    if (typeof o.savedAt !== "number" || Date.now() - o.savedAt > EDITOR_RECOVERY_TTL_MS) {
      store.removeItem(key);
      return null;
    }
    if (!o.plan || typeof o.plan !== "object") return null;
    const recovered = normalizePlan(o.plan);
    return recovered.id === planId ? recovered : null;
  } catch {
    return null;
  }
}

function readEditorRecovery(planId: string): DraftPlan | null {
  const key = editorRecoveryKey(planId);
  try {
    const fromSession = sessionStorage.getItem(key);
    if (fromSession) {
      const p = parseRecoveryPayload(fromSession, planId, sessionStorage, key);
      if (p) return p;
    }
  } catch {
    /* ignore */
  }
  try {
    const fromLocal = localStorage.getItem(key);
    if (fromLocal) return parseRecoveryPayload(fromLocal, planId, localStorage, key);
  } catch {
    /* ignore */
  }
  return null;
}

function clearEditorRecovery(planId: string) {
  const key = editorRecoveryKey(planId);
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Releitura após gravar: evita trocar o editor por plano vazio por corrida / latência da API. */
async function syncPlanAfterSave(
  fetchPlanById: (id: string) => Promise<DraftPlan | null>,
  planId: string,
  fallback: DraftPlan,
): Promise<DraftPlan> {
  /* Redes lentas / DNS corporativo: mais tentativas e espera maior até ~6s. */
  const delaysMs = [0, 450, 1100, 2400, 4200, 6200];
  for (let i = 0; i < delaysMs.length; i += 1) {
    if (delaysMs[i]! > 0) {
      await new Promise((r) => setTimeout(r, delaysMs[i]));
    }
    const fresh = await fetchPlanById(planId);
    if (!fresh) continue;
    const suspectEmpty = fallback.meals.length > 0 && fresh.meals.length === 0;
    if (!suspectEmpty) return fresh;
  }
  console.warn(
    "[Nutrik] Não foi possível confirmar o plano no servidor após salvar; mantendo cópia local enviada ao Supabase.",
    { planId, mealsLocal: fallback.meals.length },
  );
  return normalizePlan(fallback);
}

/** Rede/firewall corporativo pode deixar o fetch pendente sem rejeitar — destrava a UI. */
const SAVE_FLOW_TIMEOUT_MS = 90_000;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(
        new Error(
          `${label}: tempo limite (${Math.round(ms / 1000)}s). Verifique a internet ou o firewall da clínica e tente de novo.`,
        ),
      );
    }, ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
}

function trimPlanForPersistence(plan: DraftPlan): DraftPlan {
  return {
    ...plan,
    name: plan.name.trim(),
    description: plan.description.trim(),
    professionalName: plan.professionalName.trim(),
    professionalRegistration: plan.professionalRegistration.trim(),
    patientHeaderLabel: plan.patientHeaderLabel.trim(),
    meals: plan.meals.map((m) => ({
      ...m,
      name: m.name.trim() || "Refeição",
      time: m.time.trim() || "08:00",
      observation: m.observation.trim(),
      groups: m.groups.map((g) => ({
        ...g,
        name: g.name.trim() || "Grupo",
        options: g.options.map((o) => ({
          ...o,
          name: o.name.trim(),
          householdMeasure: o.householdMeasure.trim(),
          note: o.note.trim(),
          recipe: o.recipe.trim(),
          imageUrl: o.imageUrl.trim(),
          quantity: Number.isFinite(o.quantity) ? o.quantity : 0,
          grams: Math.max(0, o.grams || 0),
          ml: Math.max(0, o.ml || 0),
          foodId: o.foodId ?? null,
          foodCaloriesPer100: o.foodCaloriesPer100,
          foodProteinPer100: o.foodProteinPer100,
          foodCarbsPer100: o.foodCarbsPer100,
          foodFatPer100: o.foodFatPer100,
        })),
      })),
    })),
  };
}

type Props = { mode: "new" | "edit"; planId?: string };

export function DietPlanBuilder({ mode, planId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preloadPatientId = searchParams.get("patientId");
  /** `kind=template` força modelo; `kind=patient` ou só `patientId` = plano atribuído. */
  const intentKind: "template" | "patient" =
    searchParams.get("kind") === "template"
      ? "template"
      : searchParams.get("kind") === "patient" || Boolean(preloadPatientId?.trim())
        ? "patient"
        : "template";
  const { patients } = useSupabasePatients();
  const { fetchPlanById, savePlanFromBuilder, upsertPlan } = useSupabaseDietPlans();
  const [plan, setPlan] = React.useState<DraftPlan | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [notFound, setNotFound] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [lastSaved, setLastSaved] = React.useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [mealDragId, setMealDragId] = React.useState<string | null>(null);
  const [mealOverId, setMealOverId] = React.useState<string | null>(null);
  const [revisionAuthorLabel, setRevisionAuthorLabel] = React.useState("Profissional (local)");
  const [revisionAuthorUserId, setRevisionAuthorUserId] = React.useState<string | null>(null);
  const [dbVersions, setDbVersions] = React.useState<DietPlanVersionRow[]>([]);
  const [versionsLoading, setVersionsLoading] = React.useState(false);
  const [versionsError, setVersionsError] = React.useState<string | null>(null);
  const [versionListKey, setVersionListKey] = React.useState(0);
  const [savingMode, setSavingMode] = React.useState<null | "draft" | "publish">(null);
  const savingLockedRef = React.useRef(false);
  const [feedback, setFeedback] = React.useState<BuilderFeedback | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const u = data.user;
      if (u?.email) setRevisionAuthorLabel(u.email);
      else if (u?.id) setRevisionAuthorLabel(`Usuário ${u.id.slice(0, 8)}…`);
      setRevisionAuthorUserId(u?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (mode === "new") {
      setNotFound(false);
      if (intentKind === "template") {
        setPlan(createNewPlanSkeleton());
      } else if (preloadPatientId?.trim()) {
        setPlan(createNewPlanSkeleton({ linkedPatientId: preloadPatientId.trim() }));
      } else {
        setPlan(createNewPlanSkeleton());
      }
      setLoaded(true);
      return;
    }
    if (mode === "edit" && planId) {
      let cancelled = false;
      setLoaded(false);
      void (async () => {
        const recovered = readEditorRecovery(planId);
        const found = await fetchPlanById(planId);
        if (cancelled) return;
        if (!found) {
          if (recovered) {
            setNotFound(false);
            setPlan(recovered);
            clearEditorRecovery(planId);
          } else {
            setNotFound(true);
            setPlan(null);
          }
        } else if (recovered && recovered.meals.length > found.meals.length) {
          setNotFound(false);
          setPlan(recovered);
          clearEditorRecovery(planId);
        } else {
          clearEditorRecovery(planId);
          setNotFound(false);
          setPlan(found);
        }
        setLoaded(true);
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [mode, planId, fetchPlanById, preloadPatientId, intentKind]);

  /** Preenche o cabeçalho com o nome do paciente quando a lista carrega após abrir com ?patientId=. */
  React.useEffect(() => {
    if (mode !== "new" || !preloadPatientId || plan?.linkedPatientId !== preloadPatientId) return;
    if (plan.patientHeaderLabel.trim()) return;
    const p = patients.find((x) => x.id === preloadPatientId);
    if (!p) return;
    setPlan((prev) =>
      prev && prev.linkedPatientId === preloadPatientId && !prev.patientHeaderLabel.trim()
        ? { ...prev, patientHeaderLabel: p.name }
        : prev,
    );
  }, [mode, preloadPatientId, plan?.linkedPatientId, plan?.patientHeaderLabel, patients]);

  React.useEffect(() => {
    if (!plan) return;
    if (plan.planKind !== "patient_plan" || !plan.linkedPatientId) return;
    const patient = patients.find((p) => p.id === plan.linkedPatientId) ?? null;
    if (!patient) return;
    const base = profileFromPatient(patient);
    const curr = plan.nutritionProfile ?? base;
    const next = {
      ...curr,
      sex: curr.sex ?? base.sex,
      ageYears: curr.ageYears ?? base.ageYears,
      weightKg: curr.weightKg ?? base.weightKg,
      heightCm: curr.heightCm ?? base.heightCm,
      activityLevel: curr.activityLevel ?? base.activityLevel,
      goal: curr.goal ?? base.goal,
    };
    const changed = JSON.stringify(curr) !== JSON.stringify(next);
    if (!changed) return;
    setPlan((prev) => (prev ? { ...prev, nutritionProfile: next } : prev));
  }, [plan, patients]);

  React.useEffect(() => {
    if (mode !== "edit" || !plan?.id) {
      setDbVersions([]);
      return;
    }
    let cancelled = false;
    setVersionsLoading(true);
    setVersionsError(null);
    void fetchPlanVersions(plan.id)
      .then((rows) => {
        if (!cancelled) setDbVersions(rows);
      })
      .catch((e: unknown) => {
        if (!cancelled) setVersionsError(e instanceof Error ? e.message : "Erro ao carregar versões");
      })
      .finally(() => {
        if (!cancelled) setVersionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, plan?.id, versionListKey]);

  const updatePlan = React.useCallback((updater: (p: DraftPlan) => DraftPlan) => {
    setPlan((p) => {
      if (!p) return p;
      return updater(p);
    });
    setSaveError(null);
  }, []);

  const applyExample = () => {
    updatePlan((p) => ({
      ...p,
      meals: getExampleMeals(),
      professionalName: p.professionalName || "Nutricionista (exemplo)",
      patientHeaderLabel: p.patientHeaderLabel || "Paciente exemplo",
    }));
  };

  function buildNextPersistedPlan(statusForRevision: DraftPlan["status"]): DraftPlan {
    if (!plan) throw new Error("Plano inválido");
    const trimmed = trimPlanForPersistence({
      ...plan,
      status: statusForRevision,
      patientCount:
        plan.planKind === "patient_plan" && plan.linkedPatientId ? 1 : Math.max(0, Math.floor(plan.patientCount || 0)),
    });
    const snapshot = snapshotPlanForHistory(trimmed, plan.currentVersionNumber, {
      changedByLabel: revisionAuthorLabel,
      changedByUserId: revisionAuthorUserId,
    });
    return normalizePlan({
      ...trimmed,
      revisionHistory: [...plan.revisionHistory, snapshot].slice(-120),
      currentVersionNumber: plan.currentVersionNumber + 1,
    });
  }

  const saveDraft = async () => {
    if (!plan || savingLockedRef.current) return;
    const name = plan.name.trim();
    if (!name) {
      setSaveError("Dê um nome ao plano para salvar o rascunho.");
      return;
    }
    setSaveError(null);
    savingLockedRef.current = true;
    setSavingMode("draft");
    try {
      await withTimeout(
        (async () => {
          const toSave = buildNextPersistedPlan(plan.status);
          persistEditorRecovery(toSave);
          await measurePerf("ui.save_plan_draft.total", () => savePlanFromBuilder(toSave, "draft"));
          setPlan(normalizePlan(toSave));
          const merged = await syncPlanAfterSave(fetchPlanById, toSave.id, toSave);
          setPlan(merged);
          if (mode !== "new") clearEditorRecovery(toSave.id);
          setVersionListKey((k) => k + 1);
          setLastSaved(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
          if (mode === "new") router.replace(`/diet-plans/${toSave.id}/edit`);
          setFeedback({
            tone: "success",
            title: "Rascunho salvo com sucesso",
            body:
              plan.planKind === "patient_plan"
                ? "Seu plano foi salvo e ainda não está visível para o paciente."
                : "Seu modelo foi salvo na biblioteca.",
          });
        })(),
        SAVE_FLOW_TIMEOUT_MS,
        "Salvar rascunho",
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Não foi possível salvar o rascunho.";
      setSaveError(msg);
      setFeedback({ tone: "error", title: "Não foi possível salvar o rascunho.", body: msg });
    } finally {
      savingLockedRef.current = false;
      setSavingMode(null);
    }
  };

  const publishPlan = async () => {
    if (!plan || savingLockedRef.current) return;
    const name = plan.name.trim();
    if (!name) {
      setSaveError("Dê um nome ao plano antes de publicar.");
      return;
    }
    if (plan.planKind === "patient_plan" && !plan.linkedPatientId) {
      setSaveError("Selecione um paciente antes de publicar este plano.");
      setFeedback({
        tone: "error",
        title: "Paciente obrigatório",
        body: "Selecione um paciente antes de publicar este plano.",
      });
      return;
    }
    setSaveError(null);
    savingLockedRef.current = true;
    setSavingMode("publish");
    try {
      await withTimeout(
        (async () => {
          const toSave = buildNextPersistedPlan("published");
          persistEditorRecovery(toSave);
          await measurePerf("ui.publish_plan.total", () => savePlanFromBuilder(toSave, "publish"));
          setPlan(normalizePlan(toSave));
          const merged = await syncPlanAfterSave(fetchPlanById, toSave.id, toSave);
          setPlan(merged);
          if (mode !== "new") clearEditorRecovery(toSave.id);
          setVersionListKey((k) => k + 1);
          setLastSaved(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
          if (mode === "new") router.replace(`/diet-plans/${toSave.id}/edit`);
          setFeedback({
            tone: "success",
            title: "Plano publicado com sucesso",
            body:
              plan.planKind === "patient_plan"
                ? "O plano já está disponível para o paciente."
                : "O modelo está publicado na sua biblioteca.",
          });
        })(),
        SAVE_FLOW_TIMEOUT_MS,
        "Publicar plano",
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Não foi possível publicar o plano.";
      setSaveError(msg);
      setFeedback({ tone: "error", title: "Não foi possível publicar o plano.", body: msg });
    } finally {
      savingLockedRef.current = false;
      setSavingMode(null);
    }
  };

  const duplicateEntirePlanToNew = async () => {
    if (!plan) return;
    const copy = cloneEntirePlan(plan);
    try {
      await upsertPlan(copy);
      router.push(`/diet-plans/${copy.id}/edit`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao duplicar plano.");
    }
  };

  const planForHooks = plan ?? FALLBACK_PLAN_FOR_HOOKS;
  const linkedPatient = planForHooks.linkedPatientId ? patients.find((p) => p.id === planForHooks.linkedPatientId) ?? null : null;
  const nutritionProfile = planForHooks.nutritionProfile ?? profileFromPatient(linkedPatient);
  const { prescribed, engine, mealBreakdown, distributionSummary } = usePlanNutritionEngine({ ...planForHooks, nutritionProfile });

  if (!loaded || !plan) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-body14 font-semibold text-text-muted">Carregando…</div>
    );
  }

  const needsPatient =
    plan.planKind === "patient_plan" && !plan.linkedPatientId;
  const publishBlocked = needsPatient;

  if (notFound) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Plano" title="Plano não encontrado" description="Esse ID não existe na biblioteca deste dispositivo." />
        <Link href="/diet-plans" className={buttonClassName("primary", "md")}>
          Voltar à biblioteca
        </Link>
      </div>
    );
  }

  const lastPersistedRevisionAt =
    plan.revisionHistory.length > 0 ? plan.revisionHistory[plan.revisionHistory.length - 1]!.savedAt : null;

  const hasUnpublishedEdits = Boolean(
    plan.status === "published" &&
      plan.portalMeals &&
      plan.portalMeals.length > 0 &&
      JSON.stringify(plan.meals) !== JSON.stringify(plan.portalMeals),
  );

  return (
    <div className="flex min-h-0 flex-col gap-6 pb-4 md:gap-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="Construtor clínico"
          title={mode === "new" ? "Novo plano alimentar" : "Editar plano alimentar"}
          description="Use Salvar rascunho para guardar o trabalho. Publicar plano é o que libera o cardápio ao paciente (quando houver vínculo). Cada ação registra revisão com data e responsável."
        />
        <div className="flex flex-wrap gap-2">
          <Link href="/diet-plans" className={buttonClassName("outline", "md")}>
            Voltar
          </Link>
          <Link href={`/pdf/diet-plans/${plan.id}?variant=full`} className={buttonClassName("outline", "md")}>
            Visualizar PDF
          </Link>
          <Link href={`/pdf/diet-plans/${plan.id}?variant=full`} className={buttonClassName("secondary", "md")}>
            Baixar PDF
          </Link>
          <Button type="button" variant="outline" size="md" onClick={() => setPreviewOpen(true)}>
            Pré-visualizar
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={applyExample}>
            Carregar exemplo
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={() => void duplicateEntirePlanToNew()}>
            Duplicar plano
          </Button>
        </div>
      </div>

      {needsPatient ? (
        <div
          role="status"
          className="rounded-2xl border-2 border-amber-400/50 bg-amber-50/90 px-4 py-4 shadow-sm md:px-5"
        >
          <p className="text-body14 font-semibold text-text-primary">Selecione um paciente para este plano</p>
          <p className="mt-1 text-small12 font-semibold text-text-secondary">
            Escolha o paciente abaixo para vincular no Supabase (por exemplo após duplicar um plano). Você pode trocar o paciente a qualquer momento.
          </p>
          <label htmlFor="nutrik-top-patient-select" className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Paciente (obrigatório para publicar)
          </label>
          <select
            id="nutrik-top-patient-select"
            className="mt-1.5 h-11 w-full max-w-xl rounded-xl border border-neutral-200/90 bg-bg-0 px-4 text-sm font-semibold text-text-primary shadow-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
            value={plan.linkedPatientId ?? ""}
            onChange={(e) => {
              const id = e.target.value;
              updatePlan((p) => ({
                ...p,
                linkedPatientId: id === "" ? null : id,
                patientCount: id ? 1 : 0,
                status: id === "" && p.status === "published" ? "draft" : p.status,
                patientHeaderLabel: id && !p.patientHeaderLabel.trim()
                  ? patients.find((x) => x.id === id)?.name ?? p.patientHeaderLabel
                  : p.patientHeaderLabel,
              }));
            }}
          >
            <option value="">Selecione um paciente…</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.email}
              </option>
            ))}
          </select>
          {patients.length === 0 ? (
            <p className="mt-2 text-[11px] font-bold text-orange">
              Nenhum paciente cadastrado. Cadastre em <Link href="/patients" className="underline">Pacientes</Link> primeiro.
            </p>
          ) : null}
        </div>
      ) : null}

      <PlanNutritionSummary plan={plan} />

      <PlanBuilderContextStrip
        plan={plan}
        patients={patients}
        lastRevisionSavedAt={lastPersistedRevisionAt}
        mode={mode}
        hasUnpublishedEdits={hasUnpublishedEdits}
      />

      <NutritionIntelligencePanel
        patient={linkedPatient}
        profile={nutritionProfile}
        engine={engine}
        prescribed={prescribed}
        distributionSummary={distributionSummary}
        mealBreakdown={mealBreakdown}
        onProfileChange={(next) => updatePlan((p) => ({ ...p, nutritionProfile: next }))}
      />

      <PlanPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} plan={plan} patients={patients} />

      {saveError ? (
        <p className="rounded-xl border border-orange/35 bg-orange/10 px-4 py-3 text-small12 font-bold text-text-secondary">{saveError}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-text-muted">
        {lastSaved ? (
          <span className="font-bold text-secondary">Último salvamento hoje: {lastSaved}</span>
        ) : (
          <span>Salve para registrar a primeira revisão.</span>
        )}
        <span className="text-text-secondary">Versão em edição: v{plan.currentVersionNumber}</span>
      </div>

      <PlanMetaSection
        name={plan.name}
        description={plan.description}
        status={plan.status}
        patientCount={plan.patientCount}
        planKind={plan.planKind}
        linkedPatientId={plan.linkedPatientId}
        professionalName={plan.professionalName}
        professionalRegistration={plan.professionalRegistration}
        patientHeaderLabel={plan.patientHeaderLabel}
        patients={patients}
        onNameChange={(name) => updatePlan((p) => ({ ...p, name }))}
        onDescriptionChange={(description) => updatePlan((p) => ({ ...p, description }))}
        onStatusChange={(status) => updatePlan((p) => ({ ...p, status }))}
        onPatientCountChange={(patientCount) => updatePlan((p) => ({ ...p, patientCount }))}
        onPlanKindChange={(planKind) => updatePlan((p) => ({ ...p, planKind }))}
        onLinkedPatientIdChange={(linkedPatientId) => updatePlan((p) => ({ ...p, linkedPatientId }))}
        onProfessionalNameChange={(professionalName) => updatePlan((p) => ({ ...p, professionalName }))}
        onProfessionalRegistrationChange={(professionalRegistration) => updatePlan((p) => ({ ...p, professionalRegistration }))}
        onPatientHeaderLabelChange={(patientHeaderLabel) => updatePlan((p) => ({ ...p, patientHeaderLabel }))}
      />

      {mode === "edit" ? (
        <Card className="border-neutral-200/55">
          <CardHeader className="border-b border-neutral-100/90 pb-3">
            <p className="text-title16 font-semibold text-text-primary">Histórico de versões (Supabase)</p>
            <p className="mt-1 text-small12 font-semibold text-text-secondary">
              Cada “Salvar” ou “Publicar” gera uma linha em <span className="font-mono">diet_plan_versions</span> — o plano atual continua editável.
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            {versionsLoading ? (
              <p className="text-small12 font-semibold text-text-muted">Carregando versões…</p>
            ) : versionsError ? (
              <p className="text-small12 font-bold text-orange">{versionsError}</p>
            ) : dbVersions.length > 0 ? (
              <ul className="max-h-56 space-y-2 overflow-y-auto text-small12">
                {dbVersions.map((row) => {
                  const mealsLen = Array.isArray((row.structure_json as { meals?: unknown[] })?.meals)
                    ? (row.structure_json as { meals: unknown[] }).meals.length
                    : 0;
                  return (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-neutral-100/90 bg-neutral-50/50 px-3 py-2"
                    >
                      <span className="font-semibold text-text-primary">Snapshot</span>
                      <span className="font-semibold text-text-muted">
                        {new Date(row.created_at).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                      <span className="w-full text-[11px] text-text-secondary sm:w-auto">
                        {mealsLen} refeição(ões) nesta versão
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : plan.revisionHistory.length > 0 ? (
              <ul className="max-h-48 space-y-2 overflow-y-auto text-small12">
                <p className="mb-2 text-[11px] font-semibold text-text-muted">Versões antigas só no JSON (antes da migration).</p>
                {[...plan.revisionHistory].reverse().map((rev) => (
                  <li
                    key={rev.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-neutral-100/90 bg-neutral-50/50 px-3 py-2"
                  >
                    <span className="font-semibold text-text-primary">v{rev.versionNumber}</span>
                    <span className="font-semibold text-text-muted">
                      {new Date(rev.savedAt).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-small12 text-text-muted">Nenhuma versão registrada ainda — salve o plano para criar a primeira.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-4 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-h4Extra text-text-primary">Refeições e grupos</h2>
            <p className="mt-1 text-body14 text-text-secondary">
              Arraste pelo <span className="font-bold text-text-primary">::</span> para reordenar refeições. Dentro de cada uma: horário, observações e grupos com opções
              equivalentes.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => updatePlan((p) => ({ ...p, meals: [...p.meals, createEmptyMeal("Nova refeição", p.meals.length)] }))}
          >
            + Adicionar refeição
          </Button>
        </div>

        <div className="space-y-5">
          {plan.meals.map((meal, index) => (
            <div
              key={meal.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setMealOverId(meal.id);
              }}
              onDragLeave={(e) => {
                const related = e.relatedTarget as Node | null;
                if (related && e.currentTarget.contains(related)) return;
                setMealOverId((id) => (id === meal.id ? null : id));
              }}
              onDrop={(e) => {
                e.preventDefault();
                const fromId = e.dataTransfer.getData(DND_MEAL_MIME) || e.dataTransfer.getData("text/plain");
                setMealOverId(null);
                setMealDragId(null);
                if (!fromId || fromId === meal.id) return;
                const fromIdx = plan.meals.findIndex((m) => m.id === fromId);
                const toIdx = plan.meals.findIndex((m) => m.id === meal.id);
                if (fromIdx === -1 || toIdx === -1) return;
                updatePlan((p) => ({ ...p, meals: reorderMeals(p.meals, fromIdx, toIdx) }));
              }}
            >
              <MealSection
                meal={meal}
                index={index}
                totalMeals={plan.meals.length}
                dropHighlight={Boolean(mealOverId === meal.id && mealDragId && mealDragId !== meal.id)}
                isDragging={mealDragId === meal.id}
                drag={{
                  onGripDragStart: (e) => {
                    e.dataTransfer.setData(DND_MEAL_MIME, meal.id);
                    e.dataTransfer.setData("text/plain", meal.id);
                    e.dataTransfer.effectAllowed = "move";
                    setMealDragId(meal.id);
                  },
                  onGripDragEnd: () => {
                    setMealDragId(null);
                    setMealOverId(null);
                  },
                }}
                onMealChange={(next) =>
                  updatePlan((p) => ({
                    ...p,
                    meals: p.meals.map((m) => (m.id === meal.id ? next : m)),
                  }))
                }
                onDuplicateMeal={() => updatePlan((p) => ({ ...p, meals: duplicateMealInPlan(p.meals, meal.id) }))}
                onRemoveMeal={() => updatePlan((p) => ({ ...p, meals: removeMealFromPlan(p.meals, meal.id) }))}
                onMoveMeal={(dir) => updatePlan((p) => ({ ...p, meals: moveMeal(p.meals, meal.id, dir) }))}
                onAddGroup={() =>
                  updatePlan((p) => ({
                    ...p,
                    meals: addGroupToMeal(p.meals, meal.id, "Novo grupo"),
                  }))
                }
              />
            </div>
          ))}
        </div>
      </section>

      <Card className="border-neutral-200/55 bg-gradient-to-br from-neutral-50/30 to-bg-0 shadow-none">
        <CardContent className="flex flex-col gap-2 py-5 text-center sm:text-left">
          <p className="text-title16 font-semibold text-text-primary">Publicação</p>
          <p className="text-small12 leading-relaxed text-text-secondary">
            <span className="font-bold text-text-primary">Salvar rascunho</span> grava o que você está editando. Em planos já publicados, o paciente continua vendo a versão anterior até você clicar em{" "}
            <span className="font-bold text-text-primary">Publicar plano</span>.
          </p>
        </CardContent>
      </Card>

      <BuilderFeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />

      <div className="sticky bottom-0 z-30 isolate -mx-4 mt-2 border-t border-neutral-200/70 bg-bg-0/96 px-4 py-3 shadow-[0_-12px_40px_-20px_rgba(15,23,42,0.18)] backdrop-blur-lg md:-mx-6 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="max-w-xl text-small12 font-semibold text-text-muted">
            {savingMode ? (
              <span className="font-bold text-secondary">
                {savingMode === "draft" ? "Salvando rascunho…" : "Publicando plano…"}
              </span>
            ) : (
              <>Salvar rascunho e Publicar plano ficam com confirmação na tela. Aguarde o término antes de clicar de novo.</>
            )}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={Boolean(savingMode)}
              allowPointerEventsWhenDisabled={Boolean(savingMode)}
              className="cursor-pointer"
              aria-busy={savingMode === "draft"}
              onClick={() => void saveDraft()}
            >
              {savingMode === "draft" ? "Salvando rascunho…" : "Salvar rascunho"}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={publishBlocked || Boolean(savingMode)}
              allowPointerEventsWhenDisabled={Boolean(savingMode) && !publishBlocked}
              className="cursor-pointer"
              aria-busy={savingMode === "publish"}
              title={publishBlocked ? "Selecione um paciente para publicar." : undefined}
              onClick={() => void publishPlan()}
            >
              {savingMode === "publish" ? "Publicando plano…" : "Publicar plano"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
