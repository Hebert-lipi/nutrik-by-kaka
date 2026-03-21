"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/layout/dashboard/page-header";
import { loadDraftPatients } from "@/lib/draft-storage";
import type { DraftPatient } from "@/lib/draft-storage";
import { useDraftSummary } from "@/hooks/use-draft-data";
import { IconStatCheck, IconStatLayers, IconStatPeople, IconChevronRight } from "@/components/ui/icons-stat";

const btnOutline =
  "inline-flex h-11 items-center justify-center rounded-full border border-neutral-200/90 bg-bg-0 px-6 text-sm font-bold text-text-secondary shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50";
const btnPrimary =
  "inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lift transition-all hover:brightness-[0.97] active:scale-[0.99]";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase() || "?";
}

export default function DashboardPage() {
  const router = useRouter();
  const { patientsCount, plansCount, publishedCount } = useDraftSummary();
  const [recentPatients, setRecentPatients] = React.useState<DraftPatient[]>([]);

  React.useEffect(() => {
    const sync = () => setRecentPatients(loadDraftPatients().slice(0, 5));
    sync();
    window.addEventListener("nutrik-draft-storage", sync);
    return () => window.removeEventListener("nutrik-draft-storage", sync);
  }, []);

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Resumo"
        title="Visão geral"
        description="Indicadores e atalhos para o fluxo clínico: pacientes, planos e o que já está publicado."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Pacientes"
          value={String(patientsCount)}
          icon={<IconStatPeople className="text-primary" />}
          iconClassName="bg-primary/[0.14] text-primary"
          meta={
            <span className="text-[11px] font-semibold text-text-muted">
              {patientsCount === 0 ? "Nenhum cadastro listado" : "Total no diretório"}
            </span>
          }
        />
        <StatCard
          title="Planos"
          value={String(plansCount)}
          icon={<IconStatLayers className="text-neutral-700" />}
          iconClassName="bg-yellow/20 text-neutral-800"
          meta={<span className="text-[11px] font-semibold text-text-muted">Inclui rascunhos</span>}
        />
        <StatCard
          title="Publicados"
          value={String(publishedCount)}
          icon={<IconStatCheck className="text-secondary" />}
          iconClassName="bg-secondary/12 text-secondary"
          meta={<span className="text-[11px] font-semibold text-text-muted">Disponíveis ao paciente</span>}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardContent className="space-y-6 pt-6">
            <div className="flex flex-col gap-4 border-b border-neutral-100/90 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-title16 font-extrabold tracking-tight text-text-primary">Pacientes recentes</p>
                <p className="mt-1.5 max-w-xl text-[0.9375rem] leading-relaxed text-text-secondary">
                  Acesso rápido aos últimos registros que você incluiu.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Link href="/patients" className={btnOutline}>
                  Ver diretório
                </Link>
                <Link href="/patients" className={btnPrimary}>
                  Novo paciente
                </Link>
              </div>
            </div>

            {recentPatients.length === 0 ? (
              <EmptyState
                title="Nenhum paciente na lista rápida"
                description="Cadastre na página Pacientes para ver nomes e planos aparecerem aqui automaticamente."
                action={{ label: "Ir para pacientes", onClick: () => router.push("/patients") }}
                hideIllustration
              />
            ) : (
              <ul className="space-y-2">
                {recentPatients.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-100/90 bg-gradient-to-r from-bg-0 to-neutral-50/40 px-4 py-3.5 transition-all hover:border-neutral-200 hover:shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-yellow/15 text-small12 font-extrabold text-text-primary ring-1 ring-primary/10">
                        {initials(p.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-text-primary">{p.name}</p>
                        <p className="truncate text-small12 text-text-muted">{p.email}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/[0.1] px-3 py-1 text-[11px] font-bold text-text-primary ring-1 ring-primary/15">
                      {p.planLabel === "—" ? "Sem plano" : p.planLabel}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-neutral-200/50 lg:col-span-2">
          <CardContent className="flex h-full flex-col pt-6">
            <p className="text-title16 font-extrabold tracking-tight text-text-primary">Atalhos</p>
            <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-text-secondary">
              O que você usa com mais frequência.
            </p>
            <div className="mt-6 flex flex-1 flex-col gap-2">
              <Link
                href="/diet-plans"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-neutral-200/60 bg-gradient-to-br from-primary/[0.08] to-transparent px-4 py-4 transition-all hover:border-primary/25 hover:shadow-sm"
              >
                <div>
                  <p className="font-bold text-text-primary">Novo plano alimentar</p>
                  <p className="mt-0.5 text-small12 text-text-muted">Montar ou duplicar modelo</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary transition-transform group-hover:translate-x-0.5">
                  <IconChevronRight />
                </span>
              </Link>
              <Link
                href="/patients"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-neutral-200/60 bg-bg-0 px-4 py-4 transition-all hover:bg-neutral-50/80 hover:shadow-sm"
              >
                <div>
                  <p className="font-bold text-text-primary">Diretório de pacientes</p>
                  <p className="mt-0.5 text-small12 text-text-muted">Incluir ou revisar fichas</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-text-secondary transition-transform group-hover:translate-x-0.5">
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
