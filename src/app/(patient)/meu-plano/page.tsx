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
import { recordPerfMetric } from "@/lib/perf/perf-metrics";

const POLL_MS = 22_000;

export default function MeuPlanoPage() {
  const mountAtRef = React.useRef<number>(typeof performance !== "undefined" ? performance.now() : Date.now());
  const measuredRef = React.useRef(false);
  const [email, setEmail] = React.useState<string | null | undefined>(undefined);
  const [portal, setPortal] = React.useState<Awaited<ReturnType<typeof loadPatientPortalState>> | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [latestVersionAt, setLatestVersionAt] = React.useState<string | null>(null);
  const [ackAt, setAckAt] = React.useState<string | null>(null);
  const [refreshBusy, setRefreshBusy] = React.useState(false);
  const [shoppingSnapshotItems, setShoppingSnapshotItems] = React.useState<ReturnType<typeof buildShoppingListFromPlan>>([]);
  const [shoppingChecked, setShoppingChecked] = React.useState<Record<string, boolean>>({});

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

  React.useEffect(() => {
    if (portal?.kind !== "ok") return;
    let cancelled = false;
    const loadSnapshot = async () => {
      const snap = await fetchShoppingSnapshot(portal.patient.id, portal.plan.id, Math.max(1, portal.plan.currentVersionNumber));
      if (cancelled) return;
      setShoppingSnapshotItems(snap?.items ?? []);
    };
    void loadSnapshot();
    return () => {
      cancelled = true;
    };
  }, [portal]);

  const shoppingItemsFromPlan = React.useMemo(() => {
    if (portal?.kind !== "ok") return [] as ReturnType<typeof buildShoppingListFromPlan>;
    return buildShoppingListFromPlan(portal.plan);
  }, [portal]);

  const groupedShopping = React.useMemo(
    () => groupShoppingByCategory(shoppingSnapshotItems.length > 0 ? shoppingSnapshotItems : shoppingItemsFromPlan),
    [shoppingSnapshotItems, shoppingItemsFromPlan],
  );

  const shoppingListKey = React.useCallback((category: string, name: string, qty: string) => `${category}::${name}::${qty}`, []);

  const toggleShoppingItem = React.useCallback((key: string) => {
    setShoppingChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  React.useEffect(() => {
    if (measuredRef.current || !portal || portal.kind !== "ok") return;
    measuredRef.current = true;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    recordPerfMetric("ui.open.portal_meu_plano", now - mountAtRef.current, portal.kind);
  }, [portal]);

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
  const revisionFallback = getLastPlanRevisionAt(plan);
  const displayUpdatedIso = latestVersionAt ?? revisionFallback;
  const updatePending = Boolean(
    latestVersionAt && (!ackAt || new Date(latestVersionAt).getTime() > new Date(ackAt).getTime()),
  );
  const patientFirstName = patient.name.trim().split(/\s+/)[0] ?? patient.name;
  const planUpdatedLabel = displayUpdatedIso
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(displayUpdatedIso))
    : null;

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

  return (
    <div className="space-y-10 pb-6">
      <header className="overflow-hidden rounded-[1.35rem] border border-neutral-200/70 bg-white px-5 py-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.25)] ring-1 ring-black/[0.03] md:px-8 md:py-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">Acompanhamento diário</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[1.75rem]">{plan.name}</h1>
            <p className="text-[15px] text-text-secondary">
              Olá, <span className="font-semibold text-text-primary">{patientFirstName}</span> — seu plano ativo para hoje.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <Chip tone="success" className="font-semibold">
              Plano ativo
            </Chip>
            {planUpdatedLabel ? (
              <p className="max-w-[16rem] text-right text-[12px] font-medium leading-snug text-text-muted sm:text-right">
                Última atualização do plano
                <span className="mt-0.5 block font-semibold text-text-secondary">{planUpdatedLabel}</span>
              </p>
            ) : null}
          </div>
        </div>
        <p className="mt-5 border-t border-neutral-100 pt-5 text-[13px] leading-relaxed text-text-secondary">
          Este espaço foi pensado para o seu dia a dia: marque refeições, veja o que falta e deixe observações. Em caso de dúvida
          clínica, fale com sua nutricionista.
        </p>
      </header>

      <PlanMealsByPeriod
        meals={plan.meals}
        planName={plan.name}
        subtitle="Sua rotina"
        lastUpdatedIso={displayUpdatedIso}
        suppressIntroHeader
        adherence={{ patientId: patient.id, planId: plan.id }}
        planUpdate={{
          pending: updatePending,
          onRefresh: handleRefreshPlan,
          busy: refreshBusy,
        }}
      />

      {patient.portalCanShopping !== false ? (
        <Card className="border-neutral-200/60 bg-white shadow-[0_20px_50px_-32px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.03]">
          <CardContent className="space-y-5 px-5 py-6 md:px-6 md:py-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">Organização</p>
                <p className="mt-1 text-title16 font-semibold text-text-primary">Lista de compras</p>
              </div>
              <Chip tone="muted" className="shrink-0 font-semibold">
                Uso pessoal · marque o que já comprou
              </Chip>
            </div>
            {groupedShopping.length === 0 ? (
              <p className="text-[14px] leading-relaxed text-text-secondary">
                Sua nutricionista ainda não definiu itens suficientes para montar a lista de compras.
              </p>
            ) : (
              <div className="space-y-5">
                {groupedShopping.map((group) => (
                  <section
                    key={group.category}
                    className="overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50/40 ring-1 ring-black/[0.02]"
                  >
                    <div className="border-b border-neutral-100/90 bg-white/70 px-4 py-3 md:px-5">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-secondary">{group.category}</p>
                    </div>
                    <ul className="divide-y divide-neutral-100/90">
                      {group.items.map((item) => {
                        const key = shoppingListKey(group.category, item.name, item.quantityLabel);
                        const checked = Boolean(shoppingChecked[key]);
                        return (
                          <li key={key}>
                            <label className="flex cursor-pointer items-start gap-3.5 px-4 py-3.5 transition-colors hover:bg-white/80 md:px-5">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleShoppingItem(key)}
                                className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 rounded border-neutral-300 text-secondary focus:ring-secondary/30"
                                aria-label={`Marcar ${item.name}`}
                              />
                              <span className="min-w-0 flex-1">
                                <span
                                  className={`block text-[15px] font-semibold leading-snug ${
                                    checked ? "text-text-muted line-through decoration-neutral-300" : "text-text-primary"
                                  }`}
                                >
                                  {item.name}
                                </span>
                                <span className="mt-0.5 block text-[13px] font-medium text-text-secondary">{item.quantityLabel}</span>
                              </span>
                            </label>
                          </li>
                        );
                      })}
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
