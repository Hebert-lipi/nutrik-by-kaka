"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button, buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/layout/dashboard/page-header";
import { useDashboardSnapshot } from "@/hooks/use-dashboard-snapshot";
import { IconStatCheck, IconStatLayers, IconStatPeople, IconChevronRight } from "@/components/ui/icons-stat";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Chip } from "@/components/ui/chip";
import type { DraftPatient, DraftPlan } from "@/lib/draft-storage";
import { getPerfSummary } from "@/lib/perf/perf-metrics";

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

export default function DashboardPage() {
  const router = useRouter();
  const snap = useDashboardSnapshot();
  const { patients, plans, publishedPlans } = snap.counts;
  const [perfRows, setPerfRows] = React.useState<Array<{ key: string; count: number; avgMs: number; p95Ms: number }>>([]);

  React.useEffect(() => {
    const refreshPerf = () => setPerfRows(getPerfSummary().sort((a, b) => b.avgMs - a.avgMs));
    refreshPerf();
    const t = window.setInterval(refreshPerf, 3000);
    return () => window.clearInterval(t);
  }, []);

  if (snap.loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-body14 font-semibold text-text-muted">
        Carregando painel…
      </div>
    );
  }

  if (snap.error) {
    return (
      <div className="space-y-4">
        <PageHeader eyebrow="Resumo clínico" title="Visão geral" description="Dados em tempo real no Supabase." />
        <Card className="border-orange/25 bg-orange/[0.06]">
          <CardContent className="space-y-3 py-8">
            <p className="text-body14 font-semibold text-text-secondary">{snap.error}</p>
            <p className="text-small12 text-text-muted">
              Aplique o SQL em <span className="font-mono">supabase/migrations/</span> conforme docs/SUPABASE_SETUP.md
            </p>
            <Button type="button" variant="primary" size="md" onClick={() => router.refresh()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-7 md:space-y-8">
      <PageHeader
        eyebrow="Resumo clínico"
        title="Visão geral"
        description="Totais e listas vêm do Supabase (sua conta). Gráficos e métricas operacionais podem ser ligados depois."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Pacientes"
          value={String(patients)}
          trend={<Chip tone="success">Ativos: {snap.counts.activePatients}</Chip>}
          icon={<IconStatPeople className="text-primary" />}
          iconClassName="bg-primary/[0.14] text-primary"
          meta={<span className="text-[11px] font-semibold text-text-muted">Total no diretório</span>}
        />
        <StatCard
          title="Planos"
          value={String(plans)}
          trend={<Chip tone="muted">Biblioteca</Chip>}
          icon={<IconStatLayers className="text-neutral-700" />}
          iconClassName="bg-yellow/20 text-neutral-800"
          meta={<span className="text-[11px] font-semibold text-text-muted">Rascunhos e publicados</span>}
        />
        <StatCard
          title="Publicados"
          value={String(publishedPlans)}
          trend={
            <Chip tone="success" className="font-semibold">
              {plans === 0 ? "—" : `${Math.round((publishedPlans / plans) * 100)}% da biblioteca`}
            </Chip>
          }
          icon={<IconStatCheck className="text-secondary" />}
          iconClassName="bg-secondary/12 text-secondary"
          meta={<span className="text-[11px] font-semibold text-text-muted">Liberados para o paciente</span>}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5 lg:items-stretch">
        <Card className="flex h-full flex-col border-dashed border-neutral-200/90 bg-bg-0/90 lg:col-span-3">
          <CardHeader className="border-b border-neutral-100/90 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-title18 font-semibold tracking-tight text-text-primary">Evolução e tendências</p>
              <Chip tone="muted">API futura</Chip>
            </div>
            <p className="mt-2 max-w-2xl text-body14 leading-relaxed text-text-secondary">
              Gráficos de série temporal (pacientes, adesão, consultas) serão renderizados aqui quando houver endpoint
              histórico — sem dados sintéticos no painel.
            </p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center py-6">
            <EmptyState
              title="Sem série histórica ainda"
              description="Após conectar Supabase ou API, este bloco exibirá curvas reais de acompanhamento."
              hideIllustration
            />
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col lg:col-span-2">
          <CardHeader className="pb-2">
            <p className="text-title18 font-semibold tracking-tight text-text-primary">Indicadores operacionais</p>
            <p className="mt-1 text-body14 text-text-secondary">Check-ins, revisões e alertas — alimentados por integração.</p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col space-y-4 pt-4">
            <div className="rounded-lg border border-neutral-100/90 bg-bg-0 p-3 shadow-inner ring-1 ring-black/[0.02]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{snap.operational.labels.checkIns}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-text-muted">—</p>
              <p className="mt-0.5 text-small12 font-semibold text-text-muted">Aguardando fonte de dados</p>
            </div>
            <div className="rounded-lg border border-neutral-100/90 bg-bg-0 p-3 shadow-inner ring-1 ring-black/[0.02]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{snap.operational.labels.plansOpened}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-text-muted">—</p>
              <p className="mt-0.5 text-small12 font-semibold text-text-muted">Aguardando fonte de dados</p>
            </div>
            <div className="mt-auto flex flex-col gap-2">
              <Link href="/patients" className={buttonClassName("primary", "md", "w-full")}>
                Novo paciente
              </Link>
              <Link href="/diet-plans/new" className={buttonClassName("outline", "md", "w-full")}>
                Novo plano alimentar
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-neutral-200/60">
        <CardHeader className="border-b border-neutral-100/90 pb-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-title16 font-semibold text-text-primary">Métricas de performance (sessão)</p>
            <Chip tone="muted">P95 / média</Chip>
          </div>
          <p className="mt-1 text-small12 text-text-secondary">Dados locais coletados durante uso real da interface.</p>
        </CardHeader>
        <CardContent className="pt-4">
          {perfRows.length === 0 ? (
            <p className="text-small12 text-text-muted">Sem dados ainda. Navegue pelas telas e execute ações para preencher este painel.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full text-small12">
                <thead>
                  <tr className="border-b border-neutral-200/90 text-left text-[11px] uppercase tracking-wide text-text-muted">
                    <th className="py-2 pr-2">Ação</th>
                    <th className="px-2 py-2">Ocorrências</th>
                    <th className="px-2 py-2">Média (ms)</th>
                    <th className="px-2 py-2">P95 (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {perfRows.slice(0, 14).map((row) => (
                    <tr key={row.key} className="border-b border-neutral-100/80">
                      <td className="py-2 pr-2 font-semibold text-text-primary">{row.key}</td>
                      <td className="px-2 py-2 text-text-secondary">{row.count}</td>
                      <td className="px-2 py-2 text-text-secondary">{row.avgMs}</td>
                      <td className="px-2 py-2 text-text-secondary">{row.p95Ms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
        <Card className="flex h-full min-h-0 flex-col lg:max-h-[560px]">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div>
              <p className="text-title16 font-semibold text-text-primary">Atividade recente</p>
              <p className="mt-0.5 text-small12 font-semibold text-text-muted">Eventos do seu workspace</p>
            </div>
            <Chip tone="primary">Ao vivo</Chip>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col pt-2">
            {snap.activity.length === 0 ? (
              <div className="flex flex-1 flex-col justify-center py-6">
                <EmptyState
                  title="Nenhum evento listado"
                  description="Cadastre pacientes ou publique planos para ver entradas aqui."
                  hideIllustration
                />
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
                <ActivityFeed items={snap.activity} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex h-full min-h-0 flex-col lg:max-h-[560px]">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div>
              <p className="text-title16 font-semibold text-text-primary">Planos recentes</p>
              <p className="mt-0.5 text-small12 font-semibold text-text-muted">Últimos na biblioteca</p>
            </div>
            <Link href="/diet-plans" className="text-[11px] font-semibold text-primary underline-offset-4 hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col pt-2">
            {snap.recentPlans.length === 0 ? (
              <EmptyState
                title="Nenhum plano ainda"
                description="Crie um plano para preencher esta lista."
                action={{ label: "Criar plano", onClick: () => router.push("/diet-plans/new") }}
                hideIllustration
              />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
                <ul className="space-y-2">
                  {snap.recentPlans.map((pl: DraftPlan) => (
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
                      <Chip tone={pl.status === "published" ? "success" : "yellow"}>{pl.patientCount} pac.</Chip>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex h-full min-h-0 flex-col lg:max-h-[560px]">
          <CardHeader className="pb-2">
            <p className="text-title16 font-semibold text-text-primary">Pacientes recentes</p>
            <p className="mt-0.5 text-small12 font-semibold text-text-muted">Acesso rápido</p>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col pt-2">
            {snap.recentPatients.length === 0 ? (
              <EmptyState
                title="Lista vazia"
                description="Cadastre pacientes para ver atalhos neste painel."
                action={{ label: "Ir para pacientes", onClick: () => router.push("/patients") }}
                hideIllustration
              />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
                <ul className="space-y-2">
                  {snap.recentPatients.map((p: DraftPatient) => (
                    <li key={p.id}>
                      <Link
                        href={`/patients/${p.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100/90 bg-bg-0 px-3 py-3 transition-all hover:border-primary/20 hover:bg-neutral-50/40"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-yellow/15 text-small12 font-semibold text-text-primary ring-1 ring-primary/10">
                            {initials(p.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-text-primary">{p.name}</p>
                            <p className="truncate text-[11px] font-semibold text-text-muted">{p.email}</p>
                          </div>
                        </div>
                        <Chip tone="primary">{p.planLabel === "—" ? "Sem plano" : p.planLabel}</Chip>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 border-t border-neutral-100/90 pt-4">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
