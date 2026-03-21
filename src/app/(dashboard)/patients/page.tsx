"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHead, TableCell } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useDraftPatients } from "@/hooks/use-draft-data";
import { IconUsers } from "@/components/layout/dashboard/icons";

export default function PatientsPage() {
  const { patients, addPatient, removePatient } = useDraftPatients();
  const [addOpen, setAddOpen] = React.useState(false);
  const [removeId, setRemoveId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [planLabel, setPlanLabel] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  function resetForm() {
    setName("");
    setEmail("");
    setPlanLabel("");
    setFormError(null);
  }

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    const em = email.trim();
    if (!n || !em || !em.includes("@")) {
      setFormError("Informe nome completo e um e-mail válido.");
      return;
    }
    addPatient({ name: n, email: em, planLabel: planLabel.trim() || "—" });
    resetForm();
    setAddOpen(false);
  }

  function confirmRemove() {
    if (removeId) removePatient(removeId);
    setRemoveId(null);
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Cadastro"
        title="Pacientes"
        description="Diretório com nome, contato e vínculo a planos. Alterações ficam registradas neste navegador até haver integração com o servidor."
      />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/20">
                <span className="text-xl font-black text-primary" aria-hidden>
                  +
                </span>
              </div>
              <div>
                <p className="text-h4 font-extrabold tracking-tight text-text-primary">Lista de pacientes</p>
                <p className="mt-1 max-w-2xl text-body14 leading-relaxed text-text-secondary">
                  Cadastre, filtre e mantenha o histórico organizado. Use o botão principal para incluir novos registros.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              className="h-12 shrink-0 rounded-full px-8 font-bold"
              onClick={() => setAddOpen(true)}
            >
              Novo paciente
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-bg-0 shadow-inner">
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
                {patients.length === 0 ? (
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
                    <tr key={p.id} className="group hover:bg-neutral-50/70">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-small12 font-bold text-text-secondary">
                            {p.name
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((s) => s[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                          <span className="font-semibold text-text-primary">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-secondary">{p.email}</TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-small12 font-semibold text-text-primary ring-1 ring-primary/15">
                          {p.planLabel}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="ghost" size="sm" className="text-orange" onClick={() => setRemoveId(p.id)}>
                          Remover
                        </Button>
                      </TableCell>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          resetForm();
        }}
        title="Novo paciente"
        description="Preencha os dados básicos. Você pode associar um plano alimentar agora ou depois."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setAddOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" form="add-patient-form" variant="primary" className="rounded-xl">
              Salvar paciente
            </Button>
          </div>
        }
      >
        <form id="add-patient-form" className="space-y-4" onSubmit={submitAdd}>
          {formError ? (
            <p className="rounded-xl border border-orange/30 bg-orange/10 px-3 py-2 text-small12 font-semibold text-text-secondary">
              {formError}
            </p>
          ) : null}
          <Input label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          <Input
            label="E-mail"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Plano vinculado (opcional)"
            placeholder="Ex.: Plano hipocalórico — março"
            value={planLabel}
            onChange={(e) => setPlanLabel(e.target.value)}
          />
        </form>
      </Modal>

      <Modal
        open={removeId !== null}
        onClose={() => setRemoveId(null)}
        title="Remover paciente"
        description="Esta ação remove o registro da lista neste dispositivo. Você pode cadastrar novamente a qualquer momento."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setRemoveId(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="danger" className="rounded-xl" onClick={confirmRemove}>
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
