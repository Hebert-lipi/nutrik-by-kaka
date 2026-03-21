"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { PlanMealsByPeriod } from "@/components/patient-portal/plan-meals-by-period";
import { Chip } from "@/components/ui/chip";
import { useDraftPatients, useDraftPlans } from "@/hooks/use-draft-data";
import { getPublishedPlanForPatient, getLastPlanRevisionAt } from "@/lib/clinical/patient-plan";
import { buttonClassName } from "@/components/ui/button";

export default function PatientDietPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = typeof params.patientId === "string" ? params.patientId : "";
  const { patients } = useDraftPatients();
  const { plans } = useDraftPlans();

  const patient = patients.find((p) => p.id === patientId);
  const plan = patient ? getPublishedPlanForPatient(patient.id, plans) : null;
  const lastAt = getLastPlanRevisionAt(plan);

  if (!patientId || !patient) {
    return (
      <EmptyState
        title="Paciente não encontrado"
        action={{ label: "Voltar", onClick: () => router.push("/patients") }}
      />
    );
  }

  if (!plan) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Cardápio"
          title="Sem plano publicado"
          description="Publique um plano vinculado a este paciente para visualizar as refeições aqui."
        />
        <EmptyState
          title="Nenhum plano publicado"
          description="Crie ou publique um plano do tipo paciente com vínculo a este cadastro."
          action={{ label: "Ir para biblioteca", onClick: () => router.push("/diet-plans") }}
        />
        <Link href={`/patients/${patientId}`} className={buttonClassName("outline", "md", "inline-flex w-full justify-center sm:w-auto")}>
          Voltar à ficha
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Pré-visualização"
        title={`Plano de ${patient.name}`}
        description="Mesma estrutura que o paciente verá em “Meu plano”, após publicação e login com o e-mail cadastrado."
      />
      <div className="flex flex-wrap gap-2">
        <Chip tone="success">Publicado</Chip>
        <Chip tone="muted">{plan.meals.length} refeições</Chip>
      </div>
      <PlanMealsByPeriod
        meals={plan.meals}
        planName={plan.name}
        subtitle="Cardápio vinculado"
        lastUpdatedIso={lastAt}
        headerBadge={<Chip tone="primary">Modo nutricionista</Chip>}
      />
      <Link href={`/patients/${patientId}`} className={buttonClassName("outline", "md", "inline-flex justify-center")}>
        Voltar à ficha do paciente
      </Link>
    </div>
  );
}
