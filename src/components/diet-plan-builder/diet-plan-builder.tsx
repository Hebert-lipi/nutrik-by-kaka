"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const DND_MEAL_MIME = "application/x-nutrik-meal-id";

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
        })),
      })),
    })),
  };
}

type Props = { mode: "new" | "edit"; planId?: string };

export function DietPlanBuilder({ mode, planId }: Props) {
  const router = useRouter();
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
      setPlan(createNewPlanSkeleton());
      setLoaded(true);
      return;
    }
    if (mode === "edit" && planId) {
      let cancelled = false;
      setLoaded(false);
      void (async () => {
        const found = await fetchPlanById(planId);
        if (cancelled) return;
        if (!found) {
          setNotFound(true);
          setPlan(null);
        } else {
          setNotFound(false);
          setPlan(found);
        }
        setLoaded(true);
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [mode, planId, fetchPlanById]);

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

  const persist = async (statusOverride?: DraftPlan["status"]) => {
    if (!plan) return;
    const name = plan.name.trim();
    if (!name) {
      setSaveError("Informe o nome do plano para salvar.");
      return;
    }
    if (plan.planKind === "patient_plan" && !plan.linkedPatientId) {
      setSaveError("Selecione um paciente ou altere o tipo para “Plano modelo”.");
      return;
    }

    const trimmed = trimPlanForPersistence({
      ...plan,
      status: statusOverride ?? plan.status,
      patientCount:
        plan.planKind === "patient_plan" && plan.linkedPatientId ? 1 : Math.max(0, Math.floor(plan.patientCount || 0)),
    });

    const snapshot = snapshotPlanForHistory(trimmed, plan.currentVersionNumber, {
      changedByLabel: revisionAuthorLabel,
      changedByUserId: revisionAuthorUserId,
    });
    const toSave = normalizePlan({
      ...trimmed,
      revisionHistory: [...plan.revisionHistory, snapshot].slice(-120),
      currentVersionNumber: plan.currentVersionNumber + 1,
    });

    try {
      await savePlanFromBuilder(toSave);
      setPlan(toSave);
      setLastSaved(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      if (mode === "new") {
        router.replace(`/diet-plans/${toSave.id}/edit`);
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao salvar no Supabase.");
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

  if (!loaded || !plan) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-body14 font-semibold text-text-muted">Carregando…</div>
    );
  }

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

  return (
    <div className="flex min-h-0 flex-col gap-6 pb-4 md:gap-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="Construtor clínico"
          title={mode === "new" ? "Novo plano alimentar" : "Editar plano alimentar"}
          description="Monte a dieta, publique quando estiver pronta. Cada salvamento gera revisão com data/hora e autor — o paciente enxerga só a última versão publicada."
        />
        <div className="flex flex-wrap gap-2">
          <Link href="/diet-plans" className={buttonClassName("outline", "md")}>
            Voltar
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

      <PlanBuilderContextStrip
        plan={plan}
        patients={patients}
        lastRevisionSavedAt={lastPersistedRevisionAt}
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

      {plan.revisionHistory.length > 0 ? (
        <Card className="border-neutral-200/55">
          <CardHeader className="border-b border-neutral-100/90 pb-3">
            <p className="text-title16 font-extrabold text-text-primary">Histórico de versões</p>
            <p className="mt-1 text-small12 font-semibold text-text-secondary">
              Cada salvamento registra um snapshot com data/hora. Em breve: restaurar versão anterior.
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="max-h-48 space-y-2 overflow-y-auto text-small12">
              {[...plan.revisionHistory].reverse().map((rev) => (
                <li
                  key={rev.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-neutral-100/90 bg-neutral-50/50 px-3 py-2"
                >
                  <span className="font-extrabold text-text-primary">v{rev.versionNumber}</span>
                  <span className="font-semibold text-text-muted">
                    {new Date(rev.savedAt).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                  <span className="w-full text-[11px] text-text-secondary sm:w-auto">
                    {rev.name} · {rev.meals.length} refeição(ões)
                    {rev.changedByLabel ? (
                      <span className="mt-0.5 block font-semibold text-text-muted">Por {rev.changedByLabel}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
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
          <p className="text-title16 font-extrabold text-text-primary">Pronto para liberar ao paciente?</p>
          <p className="text-small12 leading-relaxed text-text-secondary">
            Use <span className="font-bold text-text-primary">Publicar</span> quando a dieta estiver finalizada. Rascunhos ficam só na sua área; o portal do paciente mostra apenas a última versão publicada vinculada a ele.
          </p>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 z-20 -mx-4 mt-2 border-t border-neutral-200/70 bg-bg-0/96 px-4 py-3 shadow-[0_-12px_40px_-20px_rgba(15,23,42,0.18)] backdrop-blur-lg md:-mx-6 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="max-w-xl text-small12 font-semibold text-text-muted">
            Salvar registra revisão com data/hora e autor (até 120 revisões neste dispositivo). Publicar não apaga versões anteriores.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button type="button" variant="outline" size="md" onClick={() => void persist("draft")}>
              Salvar como rascunho
            </Button>
            <Button type="button" variant="secondary" size="md" onClick={() => void persist()}>
              Salvar plano
            </Button>
            <Button type="button" variant="primary" size="md" onClick={() => void persist("published")}>
              Publicar plano
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
