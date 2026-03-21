"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { useDraftPatients, useDraftPlans } from "@/hooks/use-draft-data";
import { findPatientByEmail, getPublishedPlanForPatient, getLastPlanRevisionAt } from "@/lib/clinical/patient-plan";
import { PlanMealsByPeriod } from "@/components/patient-portal/plan-meals-by-period";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

export default function MeuPlanoPage() {
  const { patients } = useDraftPatients();
  const { plans } = useDraftPlans();
  const [email, setEmail] = React.useState<string | null | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setEmail(data.user?.email ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (email === undefined) {
    return (
      <div className="py-16 text-center text-body14 text-text-muted" aria-busy="true">
        Carregando…
      </div>
    );
  }

  if (!email) {
    return (
      <Card className="border-orange/25 bg-orange/[0.06]">
        <CardContent className="py-10 text-center text-body14 text-text-secondary">
          Não foi possível identificar seu e-mail. Faça login novamente.
        </CardContent>
      </Card>
    );
  }

  const patient = findPatientByEmail(patients, email);
  if (!patient) {
    return (
      <div className="space-y-6">
        <Card className="border-neutral-200/80 bg-bg-0">
          <CardContent className="space-y-3 py-8 text-center">
            <Chip tone="muted">Demonstração local</Chip>
            <p className="text-body14 leading-relaxed text-text-secondary">
              Não encontramos um paciente com o e-mail <span className="font-bold text-text-primary">{email}</span> neste
              navegador. Em produção, os dados virão do servidor e esta tela mostrará apenas o plano liberado para você.
            </p>
            <p className="text-small12 text-text-muted">
              Para testar: cadastre um paciente com o mesmo e-mail da sua conta e publique um plano vinculado a ele.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const plan = getPublishedPlanForPatient(patient.id, plans);
  if (!plan) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-small12 font-bold uppercase tracking-wide text-secondary">Olá, {patient.name.split(" ")[0]}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-text-primary md:text-3xl">Seu plano ainda não foi publicado</h1>
          <p className="mx-auto mt-3 max-w-lg text-body14 text-text-secondary">
            Quando a nutricionista publicar o plano vinculado ao seu cadastro, ele aparecerá automaticamente aqui.
          </p>
        </div>
      </div>
    );
  }

  const lastAt = getLastPlanRevisionAt(plan);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] px-4 py-4 text-center md:px-6">
        <p className="text-small12 font-bold uppercase tracking-wide text-secondary">Olá, {patient.name.split(" ")[0]}</p>
        <p className="mt-1 text-body14 text-text-secondary">
          Este é o seu plano alimentar atual. Em caso de dúvida, fale com sua nutricionista.
        </p>
        <Chip tone="success" className="mt-3 font-extrabold">
          Plano ativo
        </Chip>
      </div>

      <PlanMealsByPeriod
        meals={plan.meals}
        planName={plan.name}
        subtitle="Sua rotina"
        lastUpdatedIso={lastAt}
        adherence={{ patientId: patient.id, planId: plan.id }}
        headerBadge={
          lastAt ? (
            <Chip tone="primary" className="font-extrabold">
              Atualização disponível
            </Chip>
          ) : null
        }
      />
    </div>
  );
}
