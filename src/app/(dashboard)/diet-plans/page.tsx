"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHead, TableCell, TableRow } from "@/components/ui/table";
import { Chip } from "@/components/ui/chip";
import { StatusPill } from "@/components/ui/status-pill";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useDraftPlans } from "@/hooks/use-draft-data";
import { IconDietPlan } from "@/components/layout/dashboard/icons";

export default function DietPlansPage() {
  const { plans, addPlan, removePlan, togglePublish } = useDraftPlans();
  const [addOpen, setAddOpen] = React.useState(false);
  const [removeId, setRemoveId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [status, setStatus] = React.useState<"draft" | "published">("draft");
  const [patientCount, setPatientCount] = React.useState("0");
  const [formError, setFormError] = React.useState<string | null>(null);

  function resetForm() {
    setName("");
    setStatus("draft");
    setPatientCount("0");
    setFormError(null);
  }

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) {
      setFormError("Informe o nome do plano.");
      return;
    }
    const count = Math.max(0, Math.floor(Number(patientCount) || 0));
    addPlan({ name: n, status, patientCount: count });
    resetForm();
    setAddOpen(false);
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Biblioteca"
        title="Planos alimentares"
        description="Modelos e versões por paciente. Controle o que permanece em rascunho e o que já pode ser visto na área do paciente."
      />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow/18 ring-1 ring-yellow/25">
                <IconDietPlan className="h-7 w-7 text-neutral-800" />
              </div>
              <div>
                <p className="text-h4 font-extrabold tracking-tight text-text-primary">Biblioteca de planos</p>
                <p className="mt-1 max-w-2xl text-body14 leading-relaxed text-text-secondary">
                  Cada linha representa um plano cadastrado. Publique quando estiver pronto para liberar ao paciente.
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
              Novo plano
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-bg-0 shadow-inner">
            <Table className="min-w-[640px]">
              <thead>
                <tr>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pacientes</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr>
                    <TableCell colSpan={4} className="border-0 p-5 md:p-8">
                      <EmptyState
                        title="Nenhum plano na biblioteca"
                        description="Crie um plano para preencher a tabela. O status indica se o conteúdo ainda é rascunho ou já está publicado."
                        action={{ label: "Criar plano", onClick: () => setAddOpen(true) }}
                      />
                      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-neutral-100/90 pt-5">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Status</span>
                        <StatusPill status="draft" />
                        <StatusPill status="published" />
                      </div>
                    </TableCell>
                  </tr>
                ) : (
                  plans.map((pl) => (
                    <TableRow key={pl.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-bold text-text-primary">{pl.name}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <Chip tone="muted">Biblioteca</Chip>
                            {pl.status === "published" ? <Chip tone="success">Ativo</Chip> : <Chip tone="yellow">Em edição</Chip>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={pl.status} />
                      </TableCell>
                      <TableCell>
                        <Chip tone={pl.patientCount > 0 ? "primary" : "neutral"}>
                          {pl.patientCount === 0 ? "Sem pacientes" : `${pl.patientCount} paciente${pl.patientCount === 1 ? "" : "s"}`}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button type="button" variant="secondary" size="sm" onClick={() => togglePublish(pl.id)}>
                            {pl.status === "published" ? "Despublicar" : "Publicar"}
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="font-extrabold text-orange" onClick={() => setRemoveId(pl.id)}>
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
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
        title="Novo plano alimentar"
        description="Defina o nome, o status inicial e quantos pacientes já utilizam este modelo (pode ser zero)."
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
            <Button type="submit" form="add-plan-form" variant="primary" className="rounded-xl">
              Salvar plano
            </Button>
          </div>
        }
      >
        <form id="add-plan-form" className="space-y-4" onSubmit={submitAdd}>
          {formError ? (
            <p className="rounded-xl border border-orange/30 bg-orange/10 px-3 py-2 text-small12 font-semibold text-text-secondary">
              {formError}
            </p>
          ) : null}
          <Input label="Nome do plano" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Plano detox 14 dias" required />
          <div className="space-y-2">
            <label className="block text-body14 font-semibold text-text-secondary" htmlFor="plan-status">
              Status inicial
            </label>
            <select
              id="plan-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              className="h-11 w-full rounded-xl border border-neutral-200/90 bg-bg-0 px-4 text-sm font-medium text-text-primary shadow-sm outline-none transition-all focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
            </select>
          </div>
          <Input
            label="Pacientes vinculados (número)"
            type="number"
            min={0}
            inputMode="numeric"
            value={patientCount}
            onChange={(e) => setPatientCount(e.target.value)}
          />
        </form>
      </Modal>

      <Modal
        open={removeId !== null}
        onClose={() => setRemoveId(null)}
        title="Excluir plano"
        description="O plano será removido da lista neste dispositivo. Você pode recriar quando precisar."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setRemoveId(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              className="rounded-xl"
              onClick={() => {
                if (removeId) removePlan(removeId);
                setRemoveId(null);
              }}
            >
              Confirmar exclusão
            </Button>
          </div>
        }
      >
        <p className="text-body14 text-text-secondary">Esta ação não pode ser desfeita nesta sessão.</p>
      </Modal>
    </div>
  );
}
