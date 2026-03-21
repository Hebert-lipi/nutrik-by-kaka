"use client";

import * as React from "react";
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
  onNameChange,
  onDescriptionChange,
  onStatusChange,
  onPatientCountChange,
  className,
}: {
  name: string;
  description: string;
  status: "draft" | "published";
  patientCount: number;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onStatusChange: (v: "draft" | "published") => void;
  onPatientCountChange: (v: number) => void;
  className?: string;
}) {
  return (
    <Card className={cn("border-neutral-200/55", className)}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-neutral-100/90 pb-4">
        <div>
          <p className="text-h4Extra tracking-tight text-text-primary">Informações do plano</p>
          <p className="mt-1 text-body14 text-text-secondary">Identificação, status e vínculos (opcional).</p>
        </div>
        <Chip tone={status === "published" ? "success" : "yellow"}>{status === "published" ? "Publicado" : "Rascunho"}</Chip>
      </CardHeader>
      <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input label="Nome do plano" placeholder="Ex.: Plano hipocalórico — semana 1" value={name} onChange={(e) => onNameChange(e.target.value)} />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label htmlFor="plan-desc" className="block text-small12 font-bold uppercase tracking-wide text-text-muted">
            Descrição
          </label>
          <textarea
            id="plan-desc"
            rows={3}
            className="w-full resize-y rounded-xl border border-neutral-200/90 bg-bg-0 px-4 py-3 text-sm text-text-primary shadow-sm outline-none transition-all placeholder:text-neutral-400 focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
            placeholder="Objetivo, restrições, período de uso, observações clínicas…"
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
        <div>
          <Input
            label="Pacientes vinculados (opcional)"
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
          <p className="mt-1.5 text-[11px] font-semibold text-text-muted">Número informativo; futuramente pode vir de vínculos reais.</p>
        </div>
      </CardContent>
    </Card>
  );
}
