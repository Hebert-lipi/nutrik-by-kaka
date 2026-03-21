"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHead } from "@/components/ui/table";

export default function PatientsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Pacientes"
        description="Gerencie fichas, contatos e vincule planos alimentares a cada pessoa atendida."
      />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
                <span className="text-lg font-extrabold text-primary" aria-hidden>
                  +
                </span>
              </div>
              <div>
                <p className="text-title16 font-extrabold text-text-primary">Lista de pacientes</p>
                <p className="mt-1 max-w-xl text-body14 text-text-secondary">
                  Visualize todos os cadastros e acione ações em poucos cliques.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              className="h-11 shrink-0 rounded-lg px-6"
              onClick={() => alert("Adicionar paciente (em breve)")}
            >
              Novo paciente
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-bg-0 shadow-sm">
            <Table className="min-w-[560px]">
              <thead>
                <tr>
                  <TableHead>Paciente</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Plano vinculado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="border-0 p-6 md:p-8">
                    <EmptyState
                      title="Sua lista está pronta"
                      description="Assim que você cadastrar o primeiro paciente, os dados aparecerão nesta tabela."
                      action={{
                        label: "Cadastrar paciente",
                        onClick: () => alert("Adicionar paciente (em breve)"),
                      }}
                    />
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
