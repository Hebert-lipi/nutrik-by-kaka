"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonClassName } from "@/components/ui/button";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";
import { useSupabaseDietPlans } from "@/hooks/use-supabase-diet-plans";
import { ensureFullDietPlans } from "@/lib/supabase/diet-plan-resolve";
import { getPublishedPlanForPatient, getPlansLinkedToPatient } from "@/lib/clinical/patient-plan";
import { buildRecipesFromPlan } from "@/lib/pdf/plan-pdf-model";
import { Chip } from "@/components/ui/chip";
import type { DraftPlan } from "@/lib/draft-storage";

export default function PatientReceitasPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = typeof params.patientId === "string" ? params.patientId : "";
  const { patients, loading } = useSupabasePatients();
  const { plans, loading: plansLoading, fetchPlanById } = useSupabaseDietPlans();
  const patient = patients.find((p) => p.id === patientId);
  const linkedPlans = React.useMemo(
    () => (patient ? getPlansLinkedToPatient(patient.id, plans) : []),
    [patient?.id, plans],
  );
  const publishedPlan = patient ? getPublishedPlanForPatient(patient.id, plans) : null;
  const [resolvedLinkedPlans, setResolvedLinkedPlans] = React.useState<DraftPlan[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    if (!linkedPlans.length) {
      setResolvedLinkedPlans([]);
      return;
    }
    void ensureFullDietPlans(linkedPlans, fetchPlanById).then((full) => {
      if (!cancelled) setResolvedLinkedPlans(full);
    });
    return () => {
      cancelled = true;
    };
  }, [linkedPlans, fetchPlanById]);

  const plansForRecipes = resolvedLinkedPlans ?? linkedPlans;

  const recipes = React.useMemo(() => {
    const out = plansForRecipes.flatMap((plan) =>
      buildRecipesFromPlan(plan).map((r) => ({
        ...r,
        sourcePlanId: plan.id,
        sourcePlanName: plan.name,
        sourcePlanStatus: plan.status,
      })),
    );
    return out;
  }, [plansForRecipes]);

  const addRecipeHref = publishedPlan ? `/diet-plans/${publishedPlan.id}/edit` : `/diet-plans/new?patientId=${encodeURIComponent(patientId)}`;

  if (!patientId) {
    return <EmptyState title="ID inválido" action={{ label: "Voltar", onClick: () => router.push("/patients") }} />;
  }
  if (loading || plansLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center font-semibold text-text-muted">Carregando…</div>;
  }
  if (!patient) {
    return <EmptyState title="Paciente não encontrado" action={{ label: "Voltar", onClick: () => router.push("/patients") }} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">Receitas</p>
          <h2 className="mt-1 text-title16 font-semibold text-text-primary md:text-h4">Biblioteca do paciente</h2>
          <p className="mt-2 max-w-2xl text-small12 font-semibold text-text-secondary">
            Separado do plano alimentar. Aqui ficarão fichas técnicas e receitas liberadas só para {patient.name.split(" ")[0]}.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          className="h-11 shrink-0 rounded-full px-6 font-semibold"
          onClick={() => router.push(addRecipeHref)}
        >
          Adicionar receita
        </Button>
      </div>

      <Card className="border-neutral-200/70 bg-bg-0 shadow-premium-sm">
        <CardHeader className="border-b border-neutral-100/80 pb-4">
          <p className="text-title16 font-semibold text-text-primary">Receitas liberadas</p>
          <p className="mt-1 text-small12 font-semibold text-text-muted">Origem: itens com preparo nos planos vinculados deste paciente.</p>
        </CardHeader>
        <CardContent className="py-6">
          {recipes.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-body14 font-semibold text-text-muted">Nenhuma receita vinculada ainda.</p>
              <p className="mx-auto mt-2 max-w-md text-small12 leading-relaxed text-text-muted">
                Cadastre receitas no plano alimentar preenchendo o campo de preparo dos itens.
              </p>
              <button
                type="button"
                className={buttonClassName("outline", "md", "mt-6 inline-flex rounded-xl font-bold")}
                onClick={() => router.push(addRecipeHref)}
              >
                Começar biblioteca
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recipes.map((r, idx) => (
                <div key={`${r.title}-${r.sourcePlanId}-${idx}`} className="rounded-xl border border-neutral-200/70 bg-neutral-50/40 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-body14 font-semibold text-text-primary">{r.title}</p>
                    <Chip tone={r.sourcePlanStatus === "published" ? "success" : "yellow"}>
                      {r.sourcePlanStatus === "published" ? "Publicado" : "Rascunho"}
                    </Chip>
                  </div>
                  <p className="mt-1 text-small12 text-text-secondary">
                    Refeição: {r.sourceMealName} · Plano: {r.sourcePlanName}
                  </p>
                  <div className="mt-3">
                    <button
                      type="button"
                      className={buttonClassName("outline", "sm", "rounded-lg")}
                      onClick={() => router.push(`/diet-plans/${r.sourcePlanId}/edit`)}
                    >
                      Editar no plano
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
