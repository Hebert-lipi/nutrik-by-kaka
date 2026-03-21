"use client";

import * as React from "react";
import type { DraftPatient, PlanKind } from "@/lib/draft-storage";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

const selectClass =
  "h-11 w-full rounded-xl border border-neutral-200/90 bg-bg-0 px-4 text-sm font-semibold text-text-primary shadow-sm outline-none transition-all focus:border-primary/30 focus:ring-2 focus:ring-primary/15";

export function PlanMetaSection({
  name,
  description,
  status,
  patientCount,
  planKind,
  linkedPatientId,
  professionalName,
  professionalRegistration,
  patientHeaderLabel,
  patients,
  onNameChange,
  onDescriptionChange,
  onStatusChange,
  onPatientCountChange,
  onPlanKindChange,
  onLinkedPatientIdChange,
  onProfessionalNameChange,
  onProfessionalRegistrationChange,
  onPatientHeaderLabelChange,
  className,
}: {
  name: string;
  description: string;
  status: "draft" | "published";
  patientCount: number;
  planKind: PlanKind;
  linkedPatientId: string | null;
  professionalName: string;
  professionalRegistration: string;
  patientHeaderLabel: string;
  patients: DraftPatient[];
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onStatusChange: (v: "draft" | "published") => void;
  onPatientCountChange: (v: number) => void;
  onPlanKindChange: (v: PlanKind) => void;
  onLinkedPatientIdChange: (v: string | null) => void;
  onProfessionalNameChange: (v: string) => void;
  onProfessionalRegistrationChange: (v: string) => void;
  onPatientHeaderLabelChange: (v: string) => void;
  className?: string;
}) {
  const onPatientSelect = (id: string) => {
    if (id === "") {
      onLinkedPatientIdChange(null);
      return;
    }
    onLinkedPatientIdChange(id);
    const p = patients.find((x) => x.id === id);
    if (p && !patientHeaderLabel.trim()) {
      onPatientHeaderLabelChange(p.name);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="border-neutral-200/55">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-neutral-100/90 pb-4">
          <div>
            <p className="text-h4Extra tracking-tight text-text-primary">Dados gerais do plano</p>
            <p className="mt-1 text-body14 text-text-secondary">Identificação clínica e status de publicação.</p>
          </div>
          <Chip tone={status === "published" ? "success" : "yellow"}>{status === "published" ? "Publicado" : "Rascunho"}</Chip>
        </CardHeader>
        <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input label="Nome do plano" placeholder="Ex.: Plano hipoproteico — fase 1" value={name} onChange={(e) => onNameChange(e.target.value)} />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label htmlFor="plan-desc" className="block text-small12 font-bold uppercase tracking-wide text-text-muted">
              Descrição
            </label>
            <textarea
              id="plan-desc"
              rows={3}
              className="w-full resize-y rounded-xl border border-neutral-200/90 bg-bg-0 px-4 py-3 text-sm text-text-primary shadow-sm outline-none transition-all placeholder:text-neutral-400 focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
              placeholder="Objetivo nutricional, diagnóstico relacionado, período, restrições…"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="plan-status-field" className="block text-small12 font-bold uppercase tracking-wide text-text-muted">
              Status
            </label>
            <select
              id="plan-status-field"
              className={selectClass}
              value={status}
              onChange={(e) => onStatusChange(e.target.value as "draft" | "published")}
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="plan-kind" className="block text-small12 font-bold uppercase tracking-wide text-text-muted">
              Tipo de plano
            </label>
            <select
              id="plan-kind"
              className={selectClass}
              value={planKind}
              onChange={(e) => {
                const v = e.target.value as PlanKind;
                onPlanKindChange(v);
                if (v === "template") onLinkedPatientIdChange(null);
              }}
            >
              <option value="template">Plano modelo (biblioteca)</option>
              <option value="patient_plan">Plano atribuído a paciente</option>
            </select>
          </div>
          {planKind === "patient_plan" ? (
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="plan-patient" className="block text-small12 font-bold uppercase tracking-wide text-text-muted">
                Paciente vinculado
              </label>
              <select
                id="plan-patient"
                className={selectClass}
                value={linkedPatientId ?? ""}
                onChange={(e) => onPatientSelect(e.target.value)}
              >
                <option value="">Selecione um paciente…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.email}
                  </option>
                ))}
              </select>
              <p className="text-[11px] font-semibold text-text-muted">
                Lista do cadastro local. Futuramente sincroniza com o mesmo ID do servidor.
              </p>
            </div>
          ) : (
            <div>
              <Input
                label="Uso estimado (opcional)"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                value={patientCount === 0 ? "" : patientCount}
                onChange={(e) => {
                  const v = e.target.value;
                  onPatientCountChange(v === "" ? 0 : Math.max(0, Math.floor(Number(v) || 0)));
                }}
              />
              <p className="mt-1.5 text-[11px] font-semibold text-text-muted">Quantos pacientes costumam usar este modelo (informativo).</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-neutral-200/55 border-secondary/15 ring-1 ring-secondary/10">
        <CardHeader className="border-b border-neutral-100/90 pb-4">
          <p className="text-title16 font-extrabold text-text-primary">Profissional e cabeçalho (PDF / documento)</p>
          <p className="mt-1 text-small12 font-semibold text-text-secondary">
            Campos para futura exportação em PDF e impressão institucional.
          </p>
        </CardHeader>
        <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
          <Input
            label="Nome do profissional"
            placeholder="Ex.: Nutricionista Maria Silva"
            value={professionalName}
            onChange={(e) => onProfessionalNameChange(e.target.value)}
          />
          <Input
            label="Registro profissional (opcional)"
            placeholder="Ex.: CRN 12345/P"
            value={professionalRegistration}
            onChange={(e) => onProfessionalRegistrationChange(e.target.value)}
          />
          <div className="md:col-span-2">
            <Input
              label="Nome no cabeçalho do paciente"
              placeholder="Ex.: João da Silva — ou deixe em branco se houver paciente vinculado"
              value={patientHeaderLabel}
              onChange={(e) => onPatientHeaderLabelChange(e.target.value)}
            />
            <p className="mt-1.5 text-[11px] font-semibold text-text-muted">
              Usado na pré-visualização e no PDF. Com paciente vinculado, você pode igualar ao nome do cadastro.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
