"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { PlanMealsByPeriod } from "@/components/patient-portal/plan-meals-by-period";
import { Chip } from "@/components/ui/chip";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button, buttonClassName } from "@/components/ui/button";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";
import { useSupabaseDietPlans } from "@/hooks/use-supabase-diet-plans";
import { getPublishedPlanForPatient, getLastPlanRevisionAt, getPlansLinkedToPatient } from "@/lib/clinical/patient-plan";
import { cloneEntirePlan } from "@/lib/diet-plan-factory";
import { formatPatientDateTime } from "@/lib/patients/patient-display";
import type { DraftPlan } from "@/lib/draft-storage";
import { cn } from "@/lib/utils";

export default function PatientPlanoModulePage() {
  const params = useParams();
  const router = useRouter();
  const patientId = typeof params.patientId === "string" ? params.patientId : "";
  const { patients, loading: lp } = useSupabasePatients();
  const { plans, loading: lpl, togglePublish, upsertPlan, refresh } = useSupabaseDietPlans();

  const patient = patients.find((p) => p.id === patientId);
  const published = patient ? getPublishedPlanForPatient(patient.id, plans) : null;
  const lastAt = getLastPlanRevisionAt(published);
  const linked = patient ? getPlansLinkedToPatient(patient.id, plans) : [];

  const [actionError, setActionError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function runAction(id: string, fn: () => Promise<void>) {
    setActionError(null);
    setBusyId(id);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Erro na ação.");
    } finally {
      setBusyId(null);
    }
  }

  function sortLinked(list: DraftPlan[]): DraftPlan[] {
    return [...list].sort((a, b) => {
      const ap = a.status === "published" ? 1 : 0;
      const bp = b.status === "published" ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return b.currentVersionNumber - a.currentVersionNumber;
    });
  }

  const sorted = sortLinked(linked);

  if (!patientId) {
    return (
      <EmptyState title="Paciente não encontrado" action={{ label: "Voltar", onClick: () => router.push("/patients") }} />
    );
  }

  if (lp || lpl) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-body14 font-semibold text-text-muted">Carregando…</div>
    );
  }

  if (!patient) {
    return (
      <EmptyState title="Paciente não encontrado" action={{ label: "Voltar", onClick: () => router.push("/patients") }} />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">Plano alimentar</p>
        <h2 className="mt-1 text-title16 font-semibold text-text-primary md:text-h4">Módulo de dieta</h2>
        <p className="mt-2 max-w-3xl text-small12 font-semibold text-text-secondary">
          Plano ativo (publicado) que o paciente vê no portal, e todos os planos vinculados a este cadastro.
        </p>
      </div>

      {actionError ? (
        <p className="rounded-xl border border-orange/30 bg-orange/10 px-4 py-3 text-small12 font-bold text-text-secondary">{actionError}</p>
      ) : null}

      <Card
        className={cn(
          "overflow-hidden border-2 shadow-premium",
          published ? "border-secondary/35 bg-gradient-to-br from-secondary/[0.07] via-bg-0 to-bg-0 ring-1 ring-secondary/15" : "border-neutral-200/60",
        )}
      >
        <CardHeader className="border-b border-neutral-100/80 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={published ? "success" : "yellow"} className="font-semibold">
              {published ? "Plano ativo no portal" : "Sem plano publicado"}
            </Chip>
            {published ? (
              <Chip tone="primary" className="font-bold">
                v{published.currentVersionNumber}
              </Chip>
            ) : null}
          </div>
          <p className="mt-3 text-lg font-semibold text-text-primary md:text-title16">
            {published?.name ?? "Defina um plano publicado para este paciente"}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-small12 font-semibold text-text-secondary">
            <span>
              Status:{" "}
              <span className="font-semibold text-text-primary">{published ? "Publicado" : "—"}</span>
            </span>
            <span>
              Última publicação:{" "}
              <span className="font-semibold text-text-primary">
                {published?.publishedAt ? formatPatientDateTime(published.publishedAt) : "—"}
              </span>
            </span>
            <span>
              Última revisão salva:{" "}
              <span className="font-semibold text-text-primary">{lastAt ? formatPatientDateTime(lastAt) : "—"}</span>
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-5">
          <Link
            href={`/diet-plans/new?patientId=${encodeURIComponent(patientId)}`}
            className={buttonClassName("primary", "md", "rounded-xl")}
          >
            Criar plano
          </Link>
          {published ? (
            <>
              <Link href={`/diet-plans/${published.id}/edit`} className={buttonClassName("secondary", "md", "rounded-xl")}>
                Editar plano ativo
              </Link>
              <Button
                type="button"
                variant="outline"
                size="md"
                className="rounded-xl font-bold"
                disabled={busyId === `dup-${published.id}`}
                onClick={() =>
                  void runAction(`dup-${published.id}`, async () => {
                    const copy = cloneEntirePlan(published);
                    const next = {
                      ...copy,
                      linkedPatientId: patientId,
                      patientHeaderLabel: patient.name,
                    };
                    await upsertPlan(next);
                    router.push(`/diet-plans/${next.id}/edit`);
                  })
                }
              >
                Duplicar ativo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                className="rounded-xl font-bold"
                disabled={busyId === `unpub-${published.id}`}
                onClick={() => void runAction(`unpub-${published.id}`, () => togglePublish(published.id))}
              >
                Despublicar
              </Button>
            </>
          ) : null}
          {sorted.find((p) => p.status === "draft") ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              className="rounded-xl font-bold"
              disabled={busyId === "pub-draft"}
              onClick={() => {
                const d = sorted.find((p) => p.status === "draft");
                if (d) void runAction("pub-draft", () => togglePublish(d.id));
              }}
            >
              Publicar rascunho
            </Button>
          ) : null}
          <Link href="/diet-plans" className={buttonClassName("ghost", "md", "rounded-xl font-bold text-text-muted")}>
            Biblioteca
          </Link>
        </CardContent>
      </Card>

      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Planos deste paciente</p>
        {sorted.length === 0 ? (
          <Card className="border-dashed border-neutral-300/90 bg-neutral-50/40 shadow-inner">
            <CardContent className="py-12 text-center">
              <p className="text-body14 font-semibold text-text-muted">Nenhum plano vinculado ainda.</p>
              <Link
                href={`/diet-plans/new?patientId=${encodeURIComponent(patientId)}`}
                className={buttonClassName("primary", "md", "mt-4 inline-flex rounded-xl")}
              >
                Criar primeiro plano
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sorted.map((pl) => {
              const isActive = published?.id === pl.id;
              return (
                <Card
                  key={pl.id}
                  className={cn(
                    "border-neutral-200/55 shadow-premium-sm transition-shadow",
                    isActive && "ring-2 ring-secondary/30",
                  )}
                >
                  <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-text-primary">{pl.name}</p>
                        {isActive ? (
                          <Chip tone="success" className="font-semibold">
                            Ativo
                          </Chip>
                        ) : null}
                        <Chip tone={pl.status === "published" ? "primary" : "yellow"}>{pl.status === "published" ? "Publicado" : "Rascunho"}</Chip>
                        <Chip tone="muted">{pl.planKind === "patient_plan" ? "Paciente" : "Modelo"}</Chip>
                      </div>
                      <p className="mt-2 text-[11px] font-semibold text-text-muted">
                        {pl.meals.length} refeição(ões) · v{pl.currentVersionNumber}
                        {pl.publishedAt ? ` · publicado ${formatPatientDateTime(pl.publishedAt)}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/diet-plans/${pl.id}/edit`} className={buttonClassName("outline", "sm", "rounded-xl")}>
                        Editar
                      </Link>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="rounded-xl font-bold"
                        disabled={busyId === `dup-row-${pl.id}`}
                        onClick={() =>
                          void runAction(`dup-row-${pl.id}`, async () => {
                            const copy = cloneEntirePlan(pl);
                            const next = { ...copy, linkedPatientId: patientId, patientHeaderLabel: patient.name };
                            await upsertPlan(next);
                            router.push(`/diet-plans/${next.id}/edit`);
                          })
                        }
                      >
                        Duplicar
                      </Button>
                      <Button
                        type="button"
                        variant={pl.status === "published" ? "outline" : "primary"}
                        size="sm"
                        className="rounded-xl font-bold"
                        disabled={busyId === `tog-${pl.id}`}
                        onClick={() => void runAction(`tog-${pl.id}`, () => togglePublish(pl.id))}
                      >
                        {pl.status === "published" ? "Despublicar" : "Publicar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Pré-visualização do cardápio ativo</p>
        {!published ? (
          <EmptyState
            title="Sem cardápio no portal"
            description="Publique um plano vinculado a este paciente."
            action={{
              label: "Criar plano",
              onClick: () => router.push(`/diet-plans/new?patientId=${encodeURIComponent(patientId)}`),
            }}
          />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Chip tone="success">Publicado</Chip>
              <Chip tone="muted">{published.meals.length} refeições</Chip>
            </div>
            <PlanMealsByPeriod
              meals={published.meals}
              planName={published.name}
              subtitle="Como em /meu-plano"
              lastUpdatedIso={lastAt}
              headerBadge={<Chip tone="primary">Nutricionista</Chip>}
            />
          </>
        )}
      </div>
    </div>
  );
}
