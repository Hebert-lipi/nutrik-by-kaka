"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { DraftPatient } from "@/lib/draft-storage";
import { cn } from "@/lib/utils";

export type NewPlanIntent = { kind: "template" } | { kind: "patient"; patientId: string };

type PlanKindChoice = "template" | "patient";

export function NewPlanIntentModal({
  patients,
  onCancel,
  onContinue,
}: {
  patients: DraftPatient[];
  onCancel: () => void;
  onContinue: (intent: NewPlanIntent) => void;
}) {
  const [choice, setChoice] = React.useState<PlanKindChoice>("template");
  const [patientId, setPatientId] = React.useState("");

  const canContinue =
    choice === "template" || (choice === "patient" && Boolean(patientId.trim()));

  return (
    <Modal
      open
      onClose={onCancel}
      title="Criar novo plano"
      description="Escolha como este plano será usado. Você pode mudar detalhes depois no editor."
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            className="rounded-xl"
            disabled={!canContinue}
            onClick={() => {
              if (choice === "template") onContinue({ kind: "template" });
              else onContinue({ kind: "patient", patientId: patientId.trim() });
            }}
          >
            Continuar
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <fieldset className="space-y-3">
          <legend className="sr-only">Tipo de plano</legend>
          <button
            type="button"
            onClick={() => setChoice("template")}
            className={cn(
              "w-full rounded-2xl border-2 px-4 py-4 text-left transition-all duration-200",
              choice === "template"
                ? "border-primary/50 bg-primary/[0.07] ring-2 ring-primary/15"
                : "border-neutral-200/90 bg-bg-0 hover:border-neutral-300",
            )}
          >
            <p className="text-body14 font-bold text-text-primary">Plano modelo (biblioteca)</p>
            <p className="mt-1.5 text-small12 font-semibold leading-relaxed text-text-secondary">
              Crie um plano reutilizável para usar como base em outros pacientes.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setChoice("patient")}
            className={cn(
              "w-full rounded-2xl border-2 px-4 py-4 text-left transition-all duration-200",
              choice === "patient"
                ? "border-secondary/45 bg-secondary/[0.06] ring-2 ring-secondary/15"
                : "border-neutral-200/90 bg-bg-0 hover:border-neutral-300",
            )}
          >
            <p className="text-body14 font-bold text-text-primary">Plano atribuído a paciente</p>
            <p className="mt-1.5 text-small12 font-semibold leading-relaxed text-text-secondary">
              Crie um plano vinculado diretamente a um paciente específico.
            </p>
          </button>
        </fieldset>

        {choice === "patient" ? (
          <div className="space-y-2">
            <label htmlFor="new-plan-patient" className="block text-[11px] font-bold uppercase tracking-wide text-text-muted">
              Paciente <span className="text-orange">*</span>
            </label>
            <select
              id="new-plan-patient"
              className="h-11 w-full rounded-xl border border-neutral-200/90 bg-bg-0 px-4 text-sm font-semibold text-text-primary shadow-sm outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            >
              <option value="">Selecione o paciente…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.email}
                </option>
              ))}
            </select>
            {patients.length === 0 ? (
              <p className="text-[11px] font-bold text-orange">
                Cadastre um paciente em Pacientes antes de continuar.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
