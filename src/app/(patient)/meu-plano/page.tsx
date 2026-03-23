"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { loadPatientPortalState } from "@/lib/supabase/patient-portal";
import {
  ensurePatientPlanAckBaseline,
  fetchLatestVersionTime,
  fetchPatientPlanAck,
  upsertPatientPlanAck,
} from "@/lib/supabase/plan-versions";
import { PlanMealsByPeriod } from "@/components/patient-portal/plan-meals-by-period";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { getLastPlanRevisionAt } from "@/lib/clinical/patient-plan";
import { buildShoppingListFromPlan, groupShoppingByCategory } from "@/lib/clinical/shopping-list";
import { fetchShoppingSnapshot } from "@/lib/supabase/shopping-lists";

const POLL_MS = 22_000;

export default function MeuPlanoPage() {
  const [email, setEmail] = React.useState<string | null | undefined>(undefined);
  const [portal, setPortal] = React.useState<Awaited<ReturnType<typeof loadPatientPortalState>> | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [latestVersionAt, setLatestVersionAt] = React.useState<string | null>(null);
  const [ackAt, setAckAt] = React.useState<string | null>(null);
  const [refreshBusy, setRefreshBusy] = React.useState(false);
  const [shoppingSnapshotItems, setShoppingSnapshotItems] = React.useState<ReturnType<typeof buildShoppingListFromPlan>>([]);

  const refreshVersionMeta = React.useCallback(async (patientId: string, planId: string) => {
    const [latest, ack] = await Promise.all([
      fetchLatestVersionTime(planId),
      fetchPatientPlanAck(patientId, planId),
    ]);
    setLatestVersionAt(latest);
    setAckAt(ack);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setEmail(data.user?.email ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadPortal = React.useCallback(async () => {
    if (!email?.trim()) return;
    setLoadError(null);
    try {
      const res = await loadPatientPortalState(email);
      setPortal(res);
      if (res.kind === "ok") {
        await ensurePatientPlanAckBaseline(res.patient.id, res.plan.id);
        await refreshVersionMeta(res.patient.id, res.plan.id);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Erro ao carregar.");
    }
  }, [email, refreshVersionMeta]);

  React.useEffect(() => {
    if (email === undefined || email === null) return;
    void loadPortal();
  }, [email, loadPortal]);

  React.useEffect(() => {
    if (portal?.kind !== "ok") return;
    const { patient, plan } = portal;
    const t = window.setInterval(() => {
      void refreshVersionMeta(patient.id, plan.id);
    }, POLL_MS);
    return () => window.clearInterval(t);
  }, [portal, refreshVersionMeta]);

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
          <p className="mt-3 text-small12 text-text-muted">Confira migrations em supabase/migrations (adesão, versões, ack).</p>
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
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">Seu plano ainda não foi publicado</h1>
          <p className="mx-auto mt-3 max-w-lg text-body14 text-text-secondary">
            Quando a nutricionista publicar o plano vinculado ao seu cadastro, ele aparecerá aqui.
          </p>
        </div>
      </div>
    );
  }

  const { patient, plan } = portal;
  const shoppingItemsFromPlan = buildShoppingListFromPlan(plan);
  const groupedShopping = groupShoppingByCategory(shoppingSnapshotItems.length > 0 ? shoppingSnapshotItems : shoppingItemsFromPlan);
  const revisionFallback = getLastPlanRevisionAt(plan);
  const displayUpdatedIso = latestVersionAt ?? revisionFallback;
  const updatePending = Boolean(
    latestVersionAt && (!ackAt || new Date(latestVersionAt).getTime() > new Date(ackAt).getTime()),
  );

  const handleRefreshPlan = async () => {
    setRefreshBusy(true);
    try {
      await loadPortal();
      const latest = await fetchLatestVersionTime(plan.id);
      const ts = latest ?? new Date().toISOString();
      await upsertPatientPlanAck(patient.id, plan.id, ts);
      setAckAt(ts);
      setLatestVersionAt(latest);
    } finally {
      setRefreshBusy(false);
    }
  };

  React.useEffect(() => {
    let cancelled = false;
    const loadSnapshot = async () => {
      const snap = await fetchShoppingSnapshot(patient.id, plan.id, Math.max(1, plan.currentVersionNumber));
      if (cancelled) return;
      setShoppingSnapshotItems(snap?.items ?? []);
    };
    void loadSnapshot();
    return () => {
      cancelled = true;
    };
  }, [patient.id, plan.id, plan.currentVersionNumber]);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] px-4 py-4 text-center md:px-6">
        <p className="text-small12 font-bold uppercase tracking-wide text-secondary">Olá, {patient.name.split(" ")[0]}</p>
        <p className="mt-1 text-body14 text-text-secondary">Este é o seu plano alimentar atual. Em caso de dúvida, fale com sua nutricionista.</p>
        <Chip tone="success" className="mt-3 font-semibold">
          Plano ativo
        </Chip>
      </div>

      <PlanMealsByPeriod
        meals={plan.meals}
        planName={plan.name}
        subtitle="Sua rotina"
        lastUpdatedIso={displayUpdatedIso}
        adherence={{ patientId: patient.id, planId: plan.id }}
        planUpdate={{
          pending: updatePending,
          onRefresh: handleRefreshPlan,
          busy: refreshBusy,
        }}
      />

      {patient.portalCanShopping !== false ? (
        <Card className="border-neutral-200/70 bg-bg-0">
          <CardContent className="space-y-4 py-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-title16 font-semibold text-text-primary">Lista de compras</p>
              <Chip tone="muted">Somente leitura</Chip>
            </div>
            {groupedShopping.length === 0 ? (
              <p className="text-small12 text-text-secondary">
                Sua nutricionista ainda não definiu itens suficientes para montar a lista de compras.
              </p>
            ) : (
              <div className="space-y-3">
                {groupedShopping.map((group) => (
                  <section key={group.category} className="rounded-xl border border-neutral-200/70 bg-neutral-50/50 px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">{group.category}</p>
                    <ul className="mt-2 space-y-1 text-small12 text-text-secondary">
                      {group.items.map((item) => (
                        <li key={`${group.category}-${item.name}`}>
                          <span className="font-semibold text-text-primary">{item.name}</span> — {item.quantityLabel}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
