"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHead } from "@/components/ui/table";
import { StatusPill } from "@/components/ui/status-pill";

export default function DietPlansPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Planos alimentares"
        description="Crie rascunhos, publique quando estiver pronto e associe cada plano aos pacientes corretos."
      />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow/15 ring-1 ring-yellow/25">
                <span className="text-lg font-bold text-neutral-700" aria-hidden>
                  ≡
                </span>
              </div>
              <div>
                <p className="text-title16 font-extrabold text-text-primary">Seus planos</p>
                <p className="mt-1 max-w-xl text-body14 text-text-secondary">
                  Organize versões em rascunho e acompanhe o que já está publicado para o paciente.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              className="h-11 shrink-0 rounded-lg px-6"
              onClick={() => alert("Criar plano (em breve)")}
            >
              Novo plano
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-bg-0 shadow-sm">
            <Table className="min-w-[560px]">
              <thead>
                <tr>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pacientes</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="border-0 p-6 md:p-8">
                    <EmptyState
                      title="Nenhum plano criado"
                      description="Monte o primeiro plano alimentar. Você poderá marcar como rascunho ou publicado quando fizer sentido."
                      action={{ label: "Criar plano", onClick: () => alert("Criar plano (em breve)") }}
                    />
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <span className="text-small12 text-text-muted">Exemplo de status:</span>
                      <StatusPill status="draft" />
                      <StatusPill status="published" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
