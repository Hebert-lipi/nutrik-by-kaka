"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHead, TableCell, TableRow } from "@/components/ui/table";
import { Chip } from "@/components/ui/chip";
import { Modal } from "@/components/ui/modal";
import Link from "next/link";
import { useSupabasePatients, type NewPatientWizardInput } from "@/hooks/use-supabase-patients";
import { PatientAddWizardModal } from "@/components/patients/patient-add-wizard-modal";

function emailDomain(email: string) {
  const at = email.indexOf("@");
  if (at === -1) return null;
  return email.slice(at + 1) || null;
}

export default function PatientsPage() {
  const { patients, addPatient, removePatient, loading, error } = useSupabasePatients();
  const [addOpen, setAddOpen] = React.useState(false);
  const [removeId, setRemoveId] = React.useState<string | null>(null);
  async function submitWizard(input: NewPatientWizardInput) {
    await addPatient(input);
  }

  async function confirmRemove() {
    if (!removeId) return;
    try {
      await removePatient(removeId);
    } catch {
      /* modal fecha mesmo assim; lista atualiza no próximo refresh */
    }
    setRemoveId(null);
  }

  return (
    <div className="space-y-6 md:space-y-7">
      <PageHeader
        eyebrow="Cadastro"
        title="Pacientes"
        description="Diretório salvo no Supabase — vinculado à sua conta. Use o mesmo e-mail do paciente no login para ele acessar /meu-plano."
      />

      {error ? (
        <p className="rounded-xl border border-orange/30 bg-orange/10 px-4 py-3 text-small12 font-semibold text-text-secondary">
          {error} — confira se aplicou a migration SQL no projeto Supabase (veja docs/SUPABASE_SETUP.md).
        </p>
      ) : null}

      <Card className="min-w-0 max-w-full">
        <CardContent className="min-w-0 max-w-full space-y-6 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/20">
                <span className="text-xl font-semibold text-primary" aria-hidden>
                  +
                </span>
              </div>
              <div>
                <p className="text-h4 font-semibold tracking-tight text-text-primary">Lista de pacientes</p>
                <p className="mt-1 max-w-2xl text-body14 leading-relaxed text-text-secondary">
                  Cadastre, filtre e mantenha o histórico organizado. Use o botão principal para incluir novos registros.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              className="shrink-0 px-5"
              onClick={() => setAddOpen(true)}
            >
              Novo paciente
            </Button>
          </div>

          <div
            className="max-w-full min-w-0 overflow-x-auto overscroll-x-contain rounded-2xl border border-neutral-200/80 bg-bg-0 shadow-inner [-webkit-overflow-scrolling:touch] touch-pan-x"
            role="region"
            aria-label="Tabela de pacientes — deslize horizontalmente em telas pequenas"
          >
            <Table className="min-w-[640px]">
              <thead>
                <tr>
                  <TableHead>Paciente</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Plano vinculado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <TableCell colSpan={4} className="border-0 p-5 text-center text-body14 font-medium text-text-muted">
                      Carregando pacientes…
                    </TableCell>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <TableCell colSpan={4} className="border-0 p-5 md:p-8">
                      <EmptyState
                        title="Lista vazia"
                        description="Inclua o primeiro paciente para ativar a tabela. Cada linha pode receber um plano vinculado."
                        action={{ label: "Cadastrar paciente", onClick: () => setAddOpen(true) }}
                      />
                    </TableCell>
                  </tr>
                ) : (
                  patients.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100 text-[11px] font-semibold text-text-secondary ring-1 ring-neutral-200/60 transition-colors group-hover/row:bg-primary/10 group-hover/row:text-primary group-hover/row:ring-primary/15">
                            {p.name
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((s) => s[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/patients/${p.id}`}
                              className="block font-semibold text-text-primary underline-offset-4 hover:text-primary hover:underline"
                            >
                              {p.name}
                            </Link>
                            <Link
                              href={`/patients/${p.id}`}
                              className="mt-1.5 inline-flex max-w-[12rem] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
                            >
                              <Chip tone="muted" className="max-w-full cursor-pointer transition-opacity hover:opacity-85">
                                Ver ficha
                              </Chip>
                            </Link>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        <span className="block font-medium">{p.email}</span>
                        {emailDomain(p.email) ? (
                          <Chip tone="neutral" className="mt-2">
                            {emailDomain(p.email)}
                          </Chip>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Chip tone={p.planLabel === "—" ? "muted" : "primary"}>{p.planLabel}</Chip>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="ghost" size="sm" className="font-semibold text-orange" onClick={() => setRemoveId(p.id)}>
                          Remover
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PatientAddWizardModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={submitWizard} />

      <Modal
        open={removeId !== null}
        onClose={() => setRemoveId(null)}
        title="Remover paciente"
        description="Esta ação remove o paciente e os planos vinculados a ele no Supabase (cascade)."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setRemoveId(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="danger" onClick={confirmRemove}>
              Confirmar remoção
            </Button>
          </div>
        }
      >
        <p className="text-body14 text-text-secondary">Deseja continuar?</p>
      </Modal>
    </div>
  );
}
