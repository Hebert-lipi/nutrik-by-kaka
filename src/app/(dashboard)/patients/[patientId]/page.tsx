"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Button, buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";
import { useSupabaseDietPlans } from "@/hooks/use-supabase-diet-plans";
import { patientDietSummary } from "@/lib/clinical/dashboard-snapshot";
import { getLastPlanRevisionAt, getPublishedPlanForPatient, getPlansLinkedToPatient } from "@/lib/clinical/patient-plan";
import { useResolvedDietPlan } from "@/hooks/use-resolved-diet-plan";
import { ensureFullDietPlan } from "@/lib/supabase/diet-plan-resolve";
import { fetchAdherenceLogsForPatient, type AdherenceLogRow } from "@/lib/supabase/patient-adherence-db";
import { cloneEntirePlan } from "@/lib/diet-plan-factory";
import { formatPatientDateTime, weekStartIsoDate } from "@/lib/patients/patient-display";
import { cn } from "@/lib/utils";
import { recordPerfMetric } from "@/lib/perf/perf-metrics";

function maxIso(isos: (string | null | undefined)[]): string | null {
  const valid = isos.filter((s): s is string => Boolean(s));
  if (!valid.length) return null;
  return valid.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
}

function QuickCard({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-neutral-200/50 shadow-premium-sm ring-1 ring-black/[0.03]", className)}>
      <CardContent className="p-4 md:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">{label}</p>
        <div className="mt-2">{children}</div>
      </CardContent>
    </Card>
  );
}

export default function PatientResumoPage() {
  const mountAtRef = React.useRef<number>(typeof performance !== "undefined" ? performance.now() : Date.now());
  const measuredRef = React.useRef(false);
  const params = useParams();
  const router = useRouter();
  const patientId = typeof params.patientId === "string" ? params.patientId : "";
  const { patients, loading: patientsLoading } = useSupabasePatients();
  const { plans, loading: plansLoading, upsertPlan, refresh: refreshPlans, fetchPlanById } = useSupabaseDietPlans();

  const patient = patients.find((p) => p.id === patientId);
  const summary = patient ? patientDietSummary(patient, plans) : null;
  const published = patient ? getPublishedPlanForPatient(patient.id, plans) : null;
  const { plan: publishedDetail } = useResolvedDietPlan(published, fetchPlanById);
  const lastDietUpdateAt = getLastPlanRevisionAt(published ? (publishedDetail ?? published) : null);
  const linked = patient ? getPlansLinkedToPatient(patient.id, plans) : [];

  const [adherence, setAdherence] = React.useState<AdherenceLogRow[]>([]);
  const [adherenceLoading, setAdherenceLoading] = React.useState(false);
  const [dupBusy, setDupBusy] = React.useState(false);
  const [dupError, setDupError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!patient?.id) return;
    let c = false;
    setAdherenceLoading(true);
    void fetchAdherenceLogsForPatient(patient.id, 60)
      .then((rows) => {
        if (!c) setAdherence(rows);
      })
      .finally(() => {
        if (!c) setAdherenceLoading(false);
      });
    return () => {
      c = true;
    };
  }, [patient?.id]);

  const weekStart = weekStartIsoDate();
  const weekLogs = adherence.filter((l) => l.log_date >= weekStart);
  const weekCompletedMeals = weekLogs.filter((l) => l.scope === "meal" && l.completed).length;
  const lastAdherenceAt = adherence[0]?.updated_at ?? adherence[0]?.created_at ?? null;
  const lastInteraction = maxIso([lastAdherenceAt, patient?.updatedAt, lastDietUpdateAt]);

  const obsPending = !(patient?.clinicalNotes?.trim());

  React.useEffect(() => {
    if (measuredRef.current || patientsLoading || !patient) return;
    measuredRef.current = true;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    recordPerfMetric("ui.open.patient_summary", now - mountAtRef.current, patientId);
  }, [patientsLoading, patient, patientId]);

  async function duplicatePublished() {
    if (!published) return;
    setDupError(null);
    setDupBusy(true);
    try {
      const full = await ensureFullDietPlan(published, fetchPlanById);
      const copy = cloneEntirePlan(full);
      const withPatient = {
        ...copy,
        linkedPatientId: patientId,
        patientHeaderLabel: patient?.name ?? copy.patientHeaderLabel,
      };
      await upsertPlan(withPatient);
      await refreshPlans();
      router.push(`/diet-plans/${withPatient.id}/edit`);
    } catch (e) {
      setDupError(e instanceof Error ? e.message : "Erro ao duplicar.");
    } finally {
      setDupBusy(false);
    }
  }

  if (!patientId) {
    return (
      <EmptyState title="Paciente não encontrado" description="ID inválido." action={{ label: "Voltar", onClick: () => router.push("/patients") }} />
    );
  }

  if (patientsLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-body14 font-semibold text-text-muted">Carregando resumo…</div>
    );
  }

  if (!patient) {
    return (
      <EmptyState
        title="Paciente não encontrado"
        description="Este paciente não foi encontrado ou não está associado à sua conta."
        action={{ label: "Ir para pacientes", onClick: () => router.push("/patients") }}
      />
    );
  }

  const timelineItems: { title: string; subtitle: string; tone: "done" | "empty" }[] = [
    {
      title: "Paciente cadastrado",
      subtitle: patient.createdAt ? formatPatientDateTime(patient.createdAt) : "Data não disponível",
      tone: patient.createdAt ? "done" : "empty",
    },
    {
      title: "Plano publicado",
      subtitle: published?.publishedAt ? formatPatientDateTime(published.publishedAt) : "Nenhum plano publicado ainda",
      tone: published?.publishedAt ? "done" : "empty",
    },
    {
      title: "Plano atualizado (última revisão)",
      subtitle: lastDietUpdateAt ? formatPatientDateTime(lastDietUpdateAt) : "Sem revisões salvas",
      tone: lastDietUpdateAt ? "done" : "empty",
    },
    {
      title: "Última observação do paciente (dia)",
      subtitle: adherence.find((l) => l.scope === "daily" && l.notes?.trim())?.updated_at
        ? formatPatientDateTime(adherence.find((l) => l.scope === "daily" && l.notes?.trim())!.updated_at)
        : "Sem observação diária registrada",
      tone: adherence.some((l) => l.scope === "daily" && l.notes?.trim()) ? "done" : "empty",
    },
    {
      title: "Última marcação de refeição",
      subtitle: adherence.find((l) => l.scope === "meal")?.updated_at
        ? formatPatientDateTime(adherence.find((l) => l.scope === "meal")!.updated_at)
        : "Sem marcações ainda",
      tone: adherence.some((l) => l.scope === "meal") ? "done" : "empty",
    },
  ];

  return (
    <div className="space-y-10">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">Resumo</p>
        <h2 className="mt-1 text-title16 font-semibold text-text-primary md:text-h4 md:tracking-tight">Painel principal</h2>
        <p className="mt-2 max-w-3xl text-small12 font-semibold leading-relaxed text-text-secondary">
          Visão executiva do paciente: plano, adesão, portal e atalhos. Cada bloco pode crescer com novos indicadores sem mudar a navegação.
        </p>
      </div>

      {dupError ? (
        <p className="rounded-xl border border-orange/30 bg-orange/10 px-4 py-3 text-small12 font-bold text-text-secondary">{dupError}</p>
      ) : null}

      <section aria-label="Indicadores rápidos">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Indicadores rápidos</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <QuickCard label="Plano atual">
            {plansLoading ? (
              <div className="h-5 w-44 animate-pulse rounded bg-neutral-200/80" />
            ) : (
              <p className="text-body14 font-semibold text-text-primary">{published?.name ?? "Sem plano publicado"}</p>
            )}
            {!plansLoading && linked.length > 1 ? (
              <p className="mt-1 text-[11px] font-semibold text-text-muted">{linked.length} planos vinculados no total</p>
            ) : null}
          </QuickCard>
          <QuickCard label="Status do plano">
            {plansLoading ? (
              <div className="h-6 w-24 animate-pulse rounded-full bg-neutral-200/80" />
            ) : published ? (
              <Chip tone="success" className="font-semibold">
                Publicado
              </Chip>
            ) : linked.some((p) => p.status === "draft") ? (
              <Chip tone="yellow" className="font-semibold">
                Em rascunho
              </Chip>
            ) : (
              <span className="text-body14 font-semibold text-text-muted">Sem plano vinculado</span>
            )}
          </QuickCard>
          <QuickCard label="Acesso ao app">
            <Chip tone={patient.portalAccessActive ? "success" : "muted"} className="font-semibold">
              {patient.portalAccessActive ? "Liberado" : "Suspenso"}
            </Chip>
            <p className="mt-2 text-[11px] font-semibold text-text-muted">Permissões detalhadas no perfil</p>
          </QuickCard>
          <QuickCard label="Última interação">
            {adherenceLoading ? (
              <div className="h-5 w-36 animate-pulse rounded bg-neutral-200/80" />
            ) : (
              <p className="text-body14 font-bold text-text-primary">{formatPatientDateTime(lastInteraction, "Sem registros")}</p>
            )}
            <p className="mt-1 text-[11px] text-text-muted">Adesão, revisão do plano ou atualização da ficha</p>
          </QuickCard>
          <QuickCard label="Adesão na semana">
            {adherenceLoading ? (
              <div className="h-6 w-12 animate-pulse rounded bg-neutral-200/80" />
            ) : (
              <p className="text-title16 font-semibold tabular-nums text-text-primary">{weekCompletedMeals}</p>
            )}
            <p className="mt-1 text-[11px] font-semibold text-text-muted">Refeições marcadas como realizadas (esta semana)</p>
            {!adherenceLoading && weekLogs.length === 0 ? <p className="mt-2 text-[11px] italic text-text-muted">Sem linhas de log na semana</p> : null}
          </QuickCard>
          <QuickCard label="Observações clínicas" className={obsPending ? "ring-1 ring-amber-200/80" : ""}>
            {obsPending ? (
              <>
                <Chip tone="yellow" className="font-semibold">
                  Pendente
                </Chip>
                <p className="mt-2 text-[11px] font-semibold text-text-secondary">Inclua notas internas na aba Perfil</p>
              </>
            ) : (
              <>
                <Chip tone="success" className="font-semibold">
                  Preenchidas
                </Chip>
                <p className="mt-2 line-clamp-2 text-[11px] font-medium text-text-secondary">{patient.clinicalNotes}</p>
              </>
            )}
          </QuickCard>
        </div>
      </section>

      <section aria-label="Ações rápidas">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Ações rápidas</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href={`/diet-plans/new?patientId=${encodeURIComponent(patientId)}`}
            className={buttonClassName("primary", "md", "h-11 w-full justify-center rounded-xl")}
          >
            Novo plano
          </Link>
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="h-11 w-full rounded-xl font-bold"
            disabled={!published || dupBusy}
            onClick={() => void duplicatePublished()}
          >
            {dupBusy ? "Duplicando…" : "Duplicar plano publicado"}
          </Button>
          <Link href={`/patients/${patientId}/plano`} className={buttonClassName("secondary", "md", "h-11 w-full justify-center rounded-xl")}>
            Publicar / gerir plano
          </Link>
          <Link href={`/patients/${patientId}/avaliacoes`} className={buttonClassName("secondary", "md", "h-11 w-full justify-center rounded-xl")}>
            Avaliações clínicas
          </Link>
          <Link href={`/patients/${patientId}/diario`} className={buttonClassName("outline", "md", "h-11 w-full justify-center rounded-xl")}>
            Abrir diário
          </Link>
          <Link href={`/patients/${patientId}/materiais`} className={buttonClassName("outline", "md", "h-11 w-full justify-center rounded-xl")}>
            Enviar material
          </Link>
          <Link href={`/patients/${patientId}/receitas`} className={buttonClassName("outline", "md", "h-11 w-full justify-center rounded-xl")}>
            Liberar receita
          </Link>
        </div>
      </section>

      <section aria-label="Linha do tempo">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Linha do tempo (resumo)</p>
        <Card className="border-neutral-200/50 shadow-premium-sm">
          <CardContent className="p-0">
            <ul className="divide-y divide-neutral-100/90">
              {timelineItems.map((item) => (
                <li key={item.title} className="flex gap-4 px-4 py-4 md:px-5">
                  <span
                    className={cn(
                      "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-bg-0",
                      item.tone === "done" ? "bg-secondary ring-secondary/30" : "bg-neutral-300 ring-neutral-200",
                    )}
                  />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                    <p className="mt-1 text-[11px] font-semibold leading-relaxed text-text-secondary">{item.subtitle}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Link href={`/patients/${patientId}/historico`} className="mt-3 inline-flex text-small12 font-semibold text-primary hover:underline">
          Ver histórico completo →
        </Link>
      </section>
    </div>
  );
}
