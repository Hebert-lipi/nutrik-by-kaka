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
import {
  PatientCalendarAndPeriod,
  PatientDashboardHero,
  PatientWeeklyProgressChart,
} from "@/components/patient-portal/patient-meu-plano-dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { getLastPlanRevisionAt } from "@/lib/clinical/patient-plan";
import { buildShoppingListFromPlan, groupShoppingByCategory } from "@/lib/clinical/shopping-list";
import { fetchShoppingSnapshot } from "@/lib/supabase/shopping-lists";
import { recordPerfMetric } from "@/lib/perf/perf-metrics";
import { todayPortalLogDate } from "@/lib/clinical/patient-portal-dates";
import { minutesFromDate, summarizeDayMeals } from "@/lib/clinical/patient-portal-meal-status";
import { usePatientAdherenceSupabase } from "@/hooks/use-patient-adherence-supabase";

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
  /** Lista de compras abaixo da dobra: pequeno atraso no mount para priorizar LCP no mobile/PWA. */
  const [shoppingReady, setShoppingReady] = React.useState(false);
  const [selectedYmd, setSelectedYmd] = React.useState(() => todayPortalLogDate());
  const [nowTick, setNowTick] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

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

  const portalOkKey = portal?.kind === "ok" ? `${portal.patient.id}-${portal.plan.id}` : "";
  React.useEffect(() => {
    setShoppingReady(false);
    if (portal?.kind !== "ok") return;
    const id = window.setTimeout(() => setShoppingReady(true), 320);
    return () => window.clearTimeout(id);
  }, [portal?.kind, portalOkKey]);

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

  const portalOk = portal?.kind === "ok" ? portal : null;
  const adherencePatientId = portalOk?.patient.id;
  const adherencePlanId = portalOk?.plan.id;
  const planMealsForAdherence = portalOk?.plan.meals ?? [];
  const adherenceEnabled = Boolean(portalOk);

  const adherence = usePatientAdherenceSupabase(adherencePatientId, adherencePlanId, selectedYmd, adherenceEnabled);
  const viewIsToday = selectedYmd === todayPortalLogDate();
  const nowMinutes = React.useMemo(() => minutesFromDate(new Date(nowTick)), [nowTick]);
  const { completedCount, pendingCount, overdueCount, progressPct } = React.useMemo(
    () =>
      summarizeDayMeals(planMealsForAdherence, adherence.mealState, nowMinutes, viewIsToday, adherenceEnabled),
    [planMealsForAdherence, adherence.mealState, nowMinutes, viewIsToday, adherenceEnabled],
  );
  const selectedDateDisplay = React.useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(
        new Date(`${selectedYmd}T12:00:00`),
      ),
    [selectedYmd],
  );

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
          <p className="mt-3 text-small12 text-text-muted">Se o problema continuar, contacte a sua nutricionista ou o suporte da clínica.</p>
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
    <div className="touch-manipulation space-y-6 sm:space-y-8 md:space-y-10">
      <PatientDashboardHero
        firstName={patientFirstName}
        planName={plan.name}
        progressPct={progressPct}
        completedCount={completedCount}
        pendingCount={pendingCount}
        overdueCount={overdueCount}
        totalMeals={plan.meals.length}
        selectedDateDisplay={selectedDateDisplay}
        viewIsToday={viewIsToday}
      />

      <PatientCalendarAndPeriod selectedYmd={selectedYmd} onSelectYmd={setSelectedYmd} />

      <PatientWeeklyProgressChart
        patientId={patient.id}
        planId={plan.id}
        mealsCount={plan.meals.length}
        enabled={Boolean(plan.meals.length)}
        variant="embed"
        anchorId="seu-progresso-semanal"
      />

      <PlanMealsByPeriod
        meals={plan.meals}
        planName={plan.name}
        subtitle="Sua rotina"
        lastUpdatedIso={displayUpdatedIso}
        suppressIntroHeader
        headerBadge={
          <Chip tone="success" className="font-semibold">
            Plano ativo
          </Chip>
        }
        viewLogDate={selectedYmd}
        adherence={{ patientId: patient.id, planId: plan.id }}
        adherenceOverride={adherence}
        hideDayProgressBanner
        planUpdate={{
          pending: updatePending,
          onRefresh: handleRefreshPlan,
          busy: refreshBusy,
        }}
      />

      {patient.portalCanShopping !== false ? (
        <Card className="border-neutral-200/60 bg-white shadow-[0_20px_50px_-32px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.03]">
          <CardContent className="space-y-5 px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">Organização</p>
                <p className="mt-1 text-title16 font-semibold text-text-primary">Lista de compras</p>
              </div>
              <Chip tone="muted" className="shrink-0 font-semibold">
                Uso pessoal · marque o que já comprou
              </Chip>
            </div>
            {!shoppingReady ? (
              <div className="space-y-3" aria-hidden>
                <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-200/80" />
                <div className="h-24 animate-pulse rounded-xl bg-neutral-100/90" />
                <p className="text-center text-[12px] font-medium text-text-muted">A preparar lista de compras…</p>
              </div>
            ) : groupedShopping.length === 0 ? (
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
                            <label className="flex min-h-12 cursor-pointer items-start gap-3.5 px-4 py-3.5 transition-colors hover:bg-white/80 md:min-h-0 md:px-5">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleShoppingItem(key)}
                                className="mt-1 h-5 w-5 shrink-0 rounded border-2 border-neutral-300 text-secondary focus:ring-secondary/30 sm:mt-0.5 sm:h-[1.125rem] sm:w-[1.125rem] sm:border"
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
