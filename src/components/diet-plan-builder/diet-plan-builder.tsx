"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DraftPlan, DraftPlanFood } from "@/lib/draft-storage";
import { createEmptyMeal, getDraftPlanById, normalizePlan, upsertDraftPlan } from "@/lib/draft-storage";
import {
  addFoodToMeal,
  createNewPlanSkeleton,
  duplicateMealInPlan,
  moveMeal,
  removeFoodFromMeal,
  removeMealFromPlan,
} from "@/lib/diet-plan-factory";
import { getExampleMeals } from "@/lib/diet-plan-example";
import { PageHeader } from "@/components/layout/dashboard/page-header";
import { Button, buttonClassName } from "@/components/ui/button";
import { PlanMetaSection } from "./plan-meta-section";
import { MealCard } from "./meal-card";

type Props = { mode: "new" | "edit"; planId?: string };

export function DietPlanBuilder({ mode, planId }: Props) {
  const router = useRouter();
  /** `null` até o client montar (evita mismatch de UUID no SSR). */
  const [plan, setPlan] = React.useState<DraftPlan | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [notFound, setNotFound] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [lastSaved, setLastSaved] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (mode === "new") {
      setNotFound(false);
      setPlan(createNewPlanSkeleton());
      setLoaded(true);
      return;
    }
    if (mode === "edit" && planId) {
      const found = getDraftPlanById(planId);
      if (!found) {
        setNotFound(true);
        setPlan(null);
      } else {
        setNotFound(false);
        setPlan(found);
      }
      setLoaded(true);
    }
  }, [mode, planId]);

  const updatePlan = React.useCallback((updater: (p: DraftPlan) => DraftPlan) => {
    setPlan((p) => {
      if (!p) return p;
      return updater(p);
    });
    setSaveError(null);
  }, []);

  const applyExample = () => {
    updatePlan((p) => ({ ...p, meals: getExampleMeals() }));
  };

  const persist = (statusOverride?: DraftPlan["status"]) => {
    if (!plan) return;
    const name = plan.name.trim();
    if (!name) {
      setSaveError("Informe o nome do plano para salvar.");
      return;
    }
    const toSave = normalizePlan({
      ...plan,
      name,
      description: plan.description.trim(),
      status: statusOverride ?? plan.status,
      patientCount: Math.max(0, Math.floor(plan.patientCount || 0)),
      meals: plan.meals.map((m) => ({
        ...m,
        name: m.name.trim() || "Refeição",
        items: m.items.map((f) => ({
          ...f,
          name: f.name.trim(),
          note: (f.note ?? "").trim(),
          quantity: Number.isFinite(f.quantity) ? f.quantity : 0,
        })),
      })),
    });
    upsertDraftPlan(toSave);
    setPlan(toSave);
    setLastSaved(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    if (mode === "new") {
      router.replace(`/diet-plans/${toSave.id}/edit`);
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

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="Construtor"
          title={mode === "new" ? "Novo plano alimentar" : "Editar plano alimentar"}
          description="Monte refeições reais com alimentos, quantidades e observações — tudo salvo localmente neste navegador."
        />
        <div className="flex flex-wrap gap-2">
          <Link href="/diet-plans" className={buttonClassName("outline", "md")}>
            Voltar
          </Link>
          <Button type="button" variant="secondary" size="md" onClick={applyExample}>
            Carregar exemplo
          </Button>
        </div>
      </div>

      {saveError ? (
        <p className="rounded-xl border border-orange/35 bg-orange/10 px-4 py-3 text-small12 font-bold text-text-secondary">{saveError}</p>
      ) : null}
      {lastSaved ? (
        <p className="text-[11px] font-bold text-secondary">Último salvamento: {lastSaved}</p>
      ) : null}

      <PlanMetaSection
        name={plan.name}
        description={plan.description}
        status={plan.status}
        patientCount={plan.patientCount}
        onNameChange={(name) => updatePlan((p) => ({ ...p, name }))}
        onDescriptionChange={(description) => updatePlan((p) => ({ ...p, description }))}
        onStatusChange={(status) => updatePlan((p) => ({ ...p, status }))}
        onPatientCountChange={(patientCount) => updatePlan((p) => ({ ...p, patientCount }))}
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-h4Extra text-text-primary">Estrutura de refeições</h2>
            <p className="mt-1 text-body14 text-text-secondary">Cada card é uma refeição do dia. Adicione quantas precisar.</p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => updatePlan((p) => ({ ...p, meals: [...p.meals, createEmptyMeal("Nova refeição")] }))}
          >
            + Adicionar refeição
          </Button>
        </div>

        <div className="space-y-6">
          {plan.meals.map((meal, index) => (
            <MealCard
              key={meal.id}
              meal={meal}
              index={index}
              totalMeals={plan.meals.length}
              onMealNameChange={(name) =>
                updatePlan((p) => ({
                  ...p,
                  meals: p.meals.map((m) => (m.id === meal.id ? { ...m, name } : m)),
                }))
              }
              onRemoveMeal={() => updatePlan((p) => ({ ...p, meals: removeMealFromPlan(p.meals, meal.id) }))}
              onDuplicateMeal={() => updatePlan((p) => ({ ...p, meals: duplicateMealInPlan(p.meals, meal.id) }))}
              onMoveMeal={(dir) => updatePlan((p) => ({ ...p, meals: moveMeal(p.meals, meal.id, dir) }))}
              onAddFood={() => updatePlan((p) => ({ ...p, meals: addFoodToMeal(p.meals, meal.id) }))}
              onRemoveFood={(foodId) => updatePlan((p) => ({ ...p, meals: removeFoodFromMeal(p.meals, meal.id, foodId) }))}
              onUpdateFood={(foodId, patch) =>
                updatePlan((p) => ({
                  ...p,
                  meals: p.meals.map((m) =>
                    m.id !== meal.id
                      ? m
                      : {
                          ...m,
                          items: m.items.map((f) => (f.id === foodId ? ({ ...f, ...patch } as DraftPlanFood) : f)),
                        },
                  ),
                }))
              }
            />
          ))}
        </div>
      </section>

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-bg-0/95 p-4 shadow-premium backdrop-blur-md sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-small12 font-semibold text-text-muted">Salvar mantém refeições e alimentos no armazenamento local.</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" variant="outline" size="md" onClick={() => persist("draft")}>
            Salvar como rascunho
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={() => persist()}>
            Salvar plano
          </Button>
          <Button type="button" variant="primary" size="md" onClick={() => persist("published")}>
            Publicar plano
          </Button>
        </div>
      </div>
    </div>
  );
}
