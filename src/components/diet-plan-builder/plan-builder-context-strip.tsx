"use client";

import Link from "next/link";
import type { DraftPatient, DraftPlan } from "@/lib/draft-storage";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

function formatIso(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function PlanBuilderContextStrip({
  plan,
  patients,
  lastRevisionSavedAt,
  mode,
  hasUnpublishedEdits,
  className,
}: {
  plan: DraftPlan;
  patients: DraftPatient[];
  /** Última entrada já persistida no histórico (antes do incremento de versão ao salvar). */
  lastRevisionSavedAt: string | null;
  mode: "new" | "edit";
  /** Plano publicado: edição ainda não enviada ao paciente. */
  hasUnpublishedEdits: boolean;
  className?: string;
}) {
  const linked = plan.linkedPatientId ? patients.find((p) => p.id === plan.linkedPatientId) : null;
  const forWhom =
    plan.planKind === "patient_plan" && linked
      ? { label: "Paciente", name: linked.name, href: `/patients/${linked.id}/plano` as const }
      : plan.planKind === "patient_plan" && plan.linkedPatientId
        ? { label: "Paciente", name: "Paciente não encontrado no diretório", href: null }
        : plan.planKind === "patient_plan" && !plan.linkedPatientId
          ? { label: "Vínculo", name: "Selecione um paciente (obrigatório para publicar)", href: null }
          : { label: "Biblioteca", name: "Plano modelo (não vinculado)", href: null };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-neutral-200/70 bg-gradient-to-br from-bg-0 via-bg-0 to-neutral-50/40 shadow-premium-sm",
        className,
      )}
    >
      <div className="border-b border-neutral-100/90 bg-primary/[0.04] px-4 py-3 md:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">Resumo do plano</p>
        <p className="mt-1 text-body14 font-semibold text-text-primary">
          {mode === "new" ? "Novo plano alimentar" : "Plano alimentar"}
        </p>
        <p className="mt-1 text-small12 font-semibold text-text-secondary">
          Tipo:{" "}
          <span className="font-bold text-text-primary">
            {plan.planKind === "patient_plan" ? "Plano atribuído a paciente" : "Plano modelo (biblioteca)"}
          </span>
        </p>
        {plan.planKind === "patient_plan" ? (
          <p className="mt-0.5 text-small12 font-semibold text-text-secondary">
            Paciente:{" "}
            <span className="font-bold text-text-primary">
              {linked?.name ?? (plan.linkedPatientId ? "—" : "não selecionado")}
            </span>
          </p>
        ) : null}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Vínculo rápido</p>
            <p className="text-small12 font-semibold text-text-muted">{forWhom.label}</p>
            {forWhom.href ? (
              <Link href={forWhom.href} className="mt-0.5 block truncate text-body14 font-bold text-text-primary underline-offset-4 hover:underline">
                {forWhom.name}
              </Link>
            ) : (
              <p className="mt-0.5 truncate text-body14 font-bold text-text-primary">{forWhom.name}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={plan.status === "published" ? "success" : "yellow"} className="font-semibold">
              {plan.status === "published" ? "Publicado (no app do paciente)" : "Rascunho"}
            </Chip>
            {hasUnpublishedEdits ? (
              <Chip tone="orange" className="font-bold">
                Alterações não publicadas
              </Chip>
            ) : null}
            <Chip tone="muted" className="font-bold">
              {plan.planKind === "patient_plan" ? "Paciente" : "Modelo"}
            </Chip>
          </div>
        </div>
      </div>
      <div className="grid gap-4 px-4 py-4 sm:grid-cols-3 md:px-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Versão atual</p>
          <p className="mt-1 text-body14 font-semibold text-text-primary">v{plan.currentVersionNumber}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Última atualização registrada</p>
          <p className="mt-1 text-body14 font-semibold text-text-primary">{formatIso(lastRevisionSavedAt)}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
            Salvar rascunho grava o que você está editando. O paciente só vê o cardápio após <span className="font-bold">Publicar plano</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
