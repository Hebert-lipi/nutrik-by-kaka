"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/layout/dashboard/page-header";
import { useDraftPatients, useDraftPlans } from "@/hooks/use-draft-data";
import { IconStatCheck, IconStatLayers, IconStatPeople, IconChevronRight } from "@/components/ui/icons-stat";
import { MiniLineChart } from "@/components/ui/mini-line-chart";
import { MiniBarChart } from "@/components/ui/mini-bar-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Chip } from "@/components/ui/chip";
import { Button, buttonClassName } from "@/components/ui/button";
import {
  buildActivityFeed,
  getPatientSeries7d,
  getNewPatientsBars,
  growthLabel,
  newPatientsThisWeekLabel,
} from "@/lib/dashboard-insights";
import { cn } from "@/lib/utils";
import type { DraftPatient, DraftPlan } from "@/lib/draft-storage";

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase() || "?"
  );
}

function TrendPill({ text, positive }: { text: string; positive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-extrabold ring-1",
        positive
          ? "bg-secondary/14 text-secondary ring-secondary/25"
          : "bg-orange/12 text-orange ring-orange/25",
      )}
    >
      {text}
    </span>
  );
}

function planGrowthMock(plansCount: number): { text: string; positive: boolean } {
  if (plansCount === 0) return { text: "Estável", positive: true };
  const pct = Math.min(22, 5 + plansCount * 3);
  return { text: `+${pct}% vs. mês`, positive: true };
}

function publishedShareLabel(published: number, total: number): string {
  if (total === 0) return "—";
  return `${Math.round((published / total) * 100)}% da biblioteca`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { patients } = useDraftPatients();
  const { plans } = useDraftPlans();

  const patientsCount = patients.length;
  const plansCount = plans.length;
  const publishedCount = plans.filter((p) => p.status === "published").length;

  const series = getPatientSeries7d(patientsCount);
  const bars = getNewPatientsBars(patientsCount);
  const growth = growthLabel(patientsCount);
  const planGrowth = planGrowthMock(plansCount);
  const activityItems = React.useMemo(() => buildActivityFeed(patients, plans), [patients, plans]);
  const recentPatients = patients.slice(0, 5);
  const recentPlans: DraftPlan[] = plans.slice(0, 4);

  return (
    <div className="space-y-10 md:space-y-12">
      <PageHeader
        eyebrow="Resumo"
        title="Visão geral"
        description="Indicadores, tendências simuladas e atividade — densidade de um painel clínico vivo, sem depender do servidor."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Pacientes"
          value={String(patientsCount)}
          trend={<TrendPill text={growth.text} positive={growth.positive} />}
          icon={<IconStatPeople className="text-primary" />}
          iconClassName="bg-primary/[0.14] text-primary"
          meta={
            <span className="text-[11px] font-semibold text-text-muted">
              {newPatientsThisWeekLabel(Math.min(patientsCount, 4))}
            </span>
          }
        />
        <StatCard
          title="Planos"
          value={String(plansCount)}
          trend={<TrendPill text={planGrowth.text} positive={planGrowth.positive} />}
          icon={<IconStatLayers className="text-neutral-700" />}
          iconClassName="bg-yellow/20 text-neutral-800"
          meta={<span className="text-[11px] font-semibold text-text-muted">Rascunhos + publicados</span>}
        />
        <StatCard
          title="Publicados"
          value={String(publishedCount)}
          trend={
            <Chip tone="success" className="font-extrabold">
              {publishedShareLabel(publishedCount, plansCount)}
            </Chip>
          }
          icon={<IconStatCheck className="text-secondary" />}
          iconClassName="bg-secondary/12 text-secondary"
          meta={<span className="text-[11px] font-semibold text-text-muted">Liberados na área do paciente</span>}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="overflow-hidden lg:col-span-3">
          <CardHeader className="border-b border-neutral-100/90 pb-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-h4Extra tracking-tight text-text-primary">Evolução de pacientes</p>
                  <Chip tone="muted">7 dias · simulação</Chip>
                </div>
                <p className="mt-2 max-w-2xl text-body14 leading-relaxed text-text-secondary">
                  Linha de base ajustada ao seu total cadastrado; barras mostram novos cadastros por dia (mock).
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-extrabold text-text-primary ring-1 ring-primary/15">
                  Pico: {Math.max(...series.values)} ativos
                </span>
                <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-[11px] font-bold text-text-muted ring-1 ring-neutral-200/80">
                  Atual: {patientsCount} reais
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <MiniLineChart values={series.values} labels={series.labels} height={160} />
            <div className="grid gap-6 border-t border-neutral-100/90 pt-6 md:grid-cols-5">
              <div className="md:col-span-3">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-text-muted">Novos por dia</p>
                <MiniBarChart values={bars} className="mt-3" />
              </div>
              <div className="flex flex-col justify-center gap-3 rounded-2xl bg-gradient-to-br from-secondary/8 via-bg-0 to-primary/[0.06] p-4 ring-1 ring-primary/10 md:col-span-2">
                <p className="text-title14 font-extrabold text-text-primary">Resumo de crescimento</p>
                <p className="text-body14 leading-relaxed text-text-secondary">
                  {growth.positive ? (
                    <>
                      Trajetória <span className="font-bold text-secondary">{growth.text}</span> com base no mock + seus
                      cadastros.
                    </>
                  ) : (
                    growth.text
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Chip tone="primary">{newPatientsThisWeekLabel(Math.min(patientsCount, 5))}</Chip>
                  <Chip tone="yellow">{plansCount === 0 ? "0 planos novos" : `${Math.min(plansCount, 3)} plano(s) em foco`}</Chip>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <p className="text-h4Extra tracking-tight text-text-primary">Movimento hoje</p>
            <p className="mt-1 text-body14 text-text-secondary">Sinais rápidos para parecer produto em uso.</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="rounded-2xl border border-neutral-100/90 bg-bg-0 p-4 shadow-inner ring-1 ring-black/[0.02] transition-colors hover:border-primary/15">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-text-muted">Check-ins</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-text-primary">12</p>
              <p className="mt-0.5 text-small12 font-semibold text-secondary">+3 vs. ontem (mock)</p>
            </div>
            <div className="rounded-2xl border border-neutral-100/90 bg-bg-0 p-4 shadow-inner ring-1 ring-black/[0.02] transition-colors hover:border-yellow/30">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-text-muted">Planos abertos</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-text-primary">{Math.min(9, 3 + plansCount)}</p>
              <p className="mt-0.5 text-small12 font-semibold text-text-secondary">Visualizações simuladas</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/patients" className={buttonClassName("primary", "md", "w-full")}>
                Novo paciente
              </Link>
              <Link href="/diet-plans" className={buttonClassName("outline", "md", "w-full")}>
                Novo plano alimentar
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div>
              <p className="text-title16 font-extrabold text-text-primary">Atividade recente</p>
              <p className="mt-0.5 text-small12 font-semibold text-text-muted">Eventos + sugestões (mock)</p>
            </div>
            <Chip tone="primary">Ao vivo</Chip>
          </CardHeader>
          <CardContent className="pt-2">
            <ActivityFeed items={activityItems} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div>
              <p className="text-title16 font-extrabold text-text-primary">Planos recentes</p>
              <p className="mt-0.5 text-small12 font-semibold text-text-muted">Últimos da biblioteca</p>
            </div>
            <Link href="/diet-plans" className="text-[11px] font-extrabold text-primary underline-offset-4 hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {recentPlans.length === 0 ? (
              <EmptyState
                title="Nenhum plano ainda"
                description="Crie um plano para preencher esta lista."
                action={{ label: "Criar plano", onClick: () => router.push("/diet-plans/new") }}
                hideIllustration
              />
            ) : (
              <ul className="space-y-2">
                {recentPlans.map((pl) => (
                  <li
                    key={pl.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100/90 bg-gradient-to-r from-bg-0 to-neutral-50/30 px-3 py-3 transition-all hover:border-primary/20 hover:shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-text-primary">{pl.name}</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-text-muted">
                        {pl.status === "published" ? "Publicado" : "Rascunho"}
                      </p>
                    </div>
                    <Chip tone={pl.status === "published" ? "success" : "yellow"}>
                      {pl.patientCount} pac.
                    </Chip>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <p className="text-title16 font-extrabold text-text-primary">Pacientes recentes</p>
            <p className="mt-0.5 text-small12 font-semibold text-text-muted">Acesso rápido ao diretório</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {recentPatients.length === 0 ? (
              <EmptyState
                title="Lista vazia"
                description="Cadastre pacientes para ver movimento neste painel."
                action={{ label: "Ir para pacientes", onClick: () => router.push("/patients") }}
                hideIllustration
              />
            ) : (
              <ul className="space-y-2">
                {recentPatients.map((p: DraftPatient) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100/90 bg-bg-0 px-3 py-3 transition-all hover:border-neutral-200 hover:bg-neutral-50/40"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-yellow/15 text-small12 font-extrabold text-text-primary ring-1 ring-primary/10">
                        {initials(p.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-text-primary">{p.name}</p>
                        <p className="truncate text-[11px] font-semibold text-text-muted">{p.email}</p>
                      </div>
                    </div>
                    <Chip tone="primary">{p.planLabel === "—" ? "Sem plano" : p.planLabel}</Chip>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col gap-2 border-t border-neutral-100/90 pt-4 sm:flex-row">
              <Link href="/patients" className={buttonClassName("outline", "md", "flex-1 justify-center")}>
                Diretório completo
              </Link>
              <Button type="button" variant="secondary" size="md" className="flex-1" onClick={() => router.push("/diet-plans")}>
                Biblioteca de planos
              </Button>
            </div>
            <Link
              href="/diet-plans/new"
              className="group flex items-center justify-between gap-3 rounded-2xl border border-neutral-200/70 bg-gradient-to-br from-primary/[0.07] to-transparent px-4 py-4 transition-all hover:border-primary/25 hover:shadow-premium-sm"
            >
              <div>
                <p className="font-bold text-text-primary">Montar plano rápido</p>
                <p className="mt-0.5 text-small12 text-text-muted">Modelo ou duplicação</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary transition-transform group-hover:translate-x-0.5">
                <IconChevronRight />
              </span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
