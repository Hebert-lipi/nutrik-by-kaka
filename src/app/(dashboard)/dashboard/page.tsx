"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/layout/dashboard/page-header";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Visão geral"
        description="Acompanhe pacientes e planos alimentares em um só lugar. Use os atalhos abaixo para começar."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Pacientes"
          value="0"
          meta={<span className="text-small12 font-medium text-text-muted">Nenhum cadastrado</span>}
        />
        <StatCard
          title="Planos"
          value="0"
          meta={<span className="text-small12 font-medium text-text-muted">Crie o primeiro</span>}
        />
        <StatCard
          title="Publicados"
          value="0"
          meta={<span className="text-small12 font-medium text-text-muted">Visíveis ao paciente</span>}
        />
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col gap-4 border-b border-neutral-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-title16 font-extrabold text-text-primary">Pacientes</p>
              <p className="mt-1 max-w-xl text-body14 text-text-secondary">
                Cadastre pacientes para montar cardápios personalizados e acompanhar a evolução.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                onClick={() => alert("Adicionar paciente (em breve)")}
                className="h-11 rounded-lg px-5"
              >
                Novo paciente
              </Button>
              <Link
                href="/diet-plans"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95"
              >
                Novo plano alimentar
              </Link>
            </div>
          </div>

          <EmptyState
            title="Nenhum paciente ainda"
            description="Quando você adicionar pacientes, eles aparecerão aqui com acesso rápido aos planos."
            action={{ label: "Cadastrar paciente", onClick: () => alert("Adicionar paciente (em breve)") }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
