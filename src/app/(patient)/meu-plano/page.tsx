"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { loadPatientPortalState } from "@/lib/supabase/patient-portal";
import { PlanMealsByPeriod } from "@/components/patient-portal/plan-meals-by-period";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { getLastPlanRevisionAt } from "@/lib/clinical/patient-plan";

export default function MeuPlanoPage() {
  const [email, setEmail] = React.useState<string | null | undefined>(undefined);
  const [portal, setPortal] = React.useState<Awaited<ReturnType<typeof loadPatientPortalState>> | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setEmail(data.user?.email ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (email === undefined || email === null) return;
    let cancelled = false;
    setLoadError(null);
    void (async () => {
      try {
        const res = await loadPatientPortalState(email);
        if (!cancelled) setPortal(res);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Erro ao carregar.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email]);

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

  if (loadError) {
    return (
      <Card className="border-orange/25 bg-orange/[0.06]">
        <CardContent className="py-10 text-center text-body14 text-text-secondary">
          {loadError}
          <p className="mt-3 text-small12 text-text-muted">Confira se a migration SQL foi aplicada no Supabase.</p>
        </CardContent>
      </Card>
    );
  }

  if (!portal) {
    return (
      <div className="py-16 text-center text-body14 text-text-muted" aria-busy="true">
        Carregando seu plano…
      </div>
    );
  }

  if (portal.kind === "no_session") {
    return (
      <Card className="border-orange/25 bg-orange/[0.06]">
        <CardContent className="py-10 text-center text-body14 text-text-secondary">Sessão inválida.</CardContent>
      </Card>
    );
  }

  if (portal.kind === "not_linked") {
    return (
      <div className="space-y-6">
        <Card className="border-neutral-200/80 bg-bg-0">
          <CardContent className="space-y-3 py-8 text-center">
            <Chip tone="muted">Conta ainda não vinculada</Chip>
            <p className="text-body14 leading-relaxed text-text-secondary">
              Não encontramos um cadastro de paciente com o e-mail <span className="font-bold text-text-primary">{portal.email}</span> ou o vínculo
              ainda não foi criado. Peça à sua nutricionista para cadastrar você com este mesmo e-mail; ao acessar esta página, o sistema vincula
              automaticamente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (portal.kind === "linked_no_plan") {
    const { patient } = portal;
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-small12 font-bold uppercase tracking-wide text-secondary">Olá, {patient.name.split(" ")[0]}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-text-primary md:text-3xl">Seu plano ainda não foi publicado</h1>
          <p className="mx-auto mt-3 max-w-lg text-body14 text-text-secondary">
            Quando a nutricionista publicar o plano vinculado ao seu cadastro, ele aparecerá aqui.
          </p>
        </div>
      </div>
    );
  }

  const { patient, plan } = portal;
  const lastAt = getLastPlanRevisionAt(plan);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] px-4 py-4 text-center md:px-6">
        <p className="text-small12 font-bold uppercase tracking-wide text-secondary">Olá, {patient.name.split(" ")[0]}</p>
        <p className="mt-1 text-body14 text-text-secondary">Este é o seu plano alimentar atual. Em caso de dúvida, fale com sua nutricionista.</p>
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
