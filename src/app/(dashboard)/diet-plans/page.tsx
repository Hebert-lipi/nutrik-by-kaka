"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHead, TableCell, TableRow } from "@/components/ui/table";
import { Chip } from "@/components/ui/chip";
import { StatusPill } from "@/components/ui/status-pill";
import { Modal } from "@/components/ui/modal";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";
import { useSupabaseDietPlans } from "@/hooks/use-supabase-diet-plans";
import { IconDietPlan } from "@/components/layout/dashboard/icons";
import { buttonClassName } from "@/components/ui/button";
import { cloneEntirePlan } from "@/lib/diet-plan-factory";
import type { DraftPlan } from "@/lib/draft-storage";

export default function DietPlansPage() {
  const router = useRouter();
  const { patients } = useSupabasePatients();
  const { plans, removePlan, togglePublish, upsertPlan, loading, error } = useSupabaseDietPlans();
  const [listError, setListError] = React.useState<string | null>(null);

  function patientLabel(id: string | null) {
    if (!id) return null;
    return patients.find((p) => p.id === id)?.name ?? null;
  }

  async function duplicatePlan(pl: DraftPlan) {
    const copy = cloneEntirePlan(pl);
    setListError(null);
    try {
      await upsertPlan(copy);
      router.push(`/diet-plans/${copy.id}/edit`);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Erro ao duplicar.");
    }
  }
  const [removeId, setRemoveId] = React.useState<string | null>(null);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Biblioteca"
        title="Planos alimentares"
        description="Planos salvos no Supabase. Publique para liberar ao paciente vinculado em /meu-plano."
      />

      {error || listError ? (
        <p className="rounded-xl border border-orange/30 bg-orange/10 px-4 py-3 text-small12 font-semibold text-text-secondary">
          {error ?? listError}
        </p>
      ) : null}

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow/18 ring-1 ring-yellow/25">
                <IconDietPlan className="h-7 w-7 text-neutral-800" />
              </div>
              <div>
                <p className="text-h4 font-semibold tracking-tight text-text-primary">Biblioteca de planos</p>
                <p className="mt-1 max-w-2xl text-body14 leading-relaxed text-text-secondary">
                  Cada plano pode incluir várias refeições e itens. Abra o construtor para ver e editar a estrutura completa.
                </p>
              </div>
            </div>

            <Link href="/diet-plans/new" className={buttonClassName("primary", "lg", "h-12 shrink-0 justify-center px-8")}>
              Novo plano
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-bg-0 shadow-inner">
            <Table className="min-w-[720px]">
              <thead>
                <tr>
                  <TableHead>Plano</TableHead>
                  <TableHead>Refeições</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pacientes</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <TableCell colSpan={6} className="border-0 p-8 text-center text-body14 font-semibold text-text-muted">
                      Carregando planos…
                    </TableCell>
                  </tr>
                ) : plans.length === 0 ? (
                  <tr>
                    <TableCell colSpan={6} className="border-0 p-5 md:p-8">
                      <EmptyState
                        title="Nenhum plano na biblioteca"
                        description="Abra o construtor para montar refeições e alimentos como em um app profissional de nutrição."
                        action={{ label: "Criar plano", onClick: () => router.push("/diet-plans/new") }}
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
                          {pl.description ? (
                            <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug text-text-muted">{pl.description}</p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <Chip tone="muted">Biblioteca</Chip>
                            {pl.status === "published" ? <Chip tone="success">Ativo</Chip> : <Chip tone="yellow">Em edição</Chip>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip tone="primary">{pl.meals.length} refeição(ões)</Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <Chip tone={pl.planKind === "patient_plan" ? "success" : "muted"}>
                            {pl.planKind === "patient_plan" ? "Paciente" : "Modelo"}
                          </Chip>
                          <span className="text-[10px] font-bold text-text-muted">v{pl.currentVersionNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={pl.status} />
                      </TableCell>
                      <TableCell>
                        {pl.planKind === "patient_plan" && pl.linkedPatientId ? (
                          <Chip tone="primary">{patientLabel(pl.linkedPatientId) ?? "Paciente"}</Chip>
                        ) : (
                          <Chip tone={pl.patientCount > 0 ? "primary" : "neutral"}>
                            {pl.patientCount === 0 ? "—" : `${pl.patientCount} uso(s) est.`}
                          </Chip>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link href={`/diet-plans/${pl.id}/edit`} className={buttonClassName("outline", "sm", "rounded-full")}>
                            Editar
                          </Link>
                          <Button type="button" variant="outline" size="sm" onClick={() => void duplicatePlan(pl)}>
                            Duplicar
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              void (async () => {
                                try {
                                  await togglePublish(pl.id);
                                } catch (e) {
                                  setListError(e instanceof Error ? e.message : "Erro ao publicar.");
                                }
                              })();
                            }}
                          >
                            {pl.status === "published" ? "Despublicar" : "Publicar"}
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="font-semibold text-orange" onClick={() => setRemoveId(pl.id)}>
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
        open={removeId !== null}
        onClose={() => setRemoveId(null)}
        title="Excluir plano"
        description="O plano será excluído permanentemente no Supabase."
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
                void (async () => {
                  if (removeId) {
                    try {
                      await removePlan(removeId);
                    } catch (e) {
                      setListError(e instanceof Error ? e.message : "Erro ao excluir.");
                    }
                  }
                  setRemoveId(null);
                })();
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
