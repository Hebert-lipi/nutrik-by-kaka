"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Chip } from "@/components/ui/chip";
import { Button, buttonClassName } from "@/components/ui/button";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";
import { PATIENT_WORKSPACE_TABS, patientWorkspaceHref } from "@/lib/patients/workspace-nav";
import type { PatientClinicalStatus } from "@/lib/draft-storage";
import {
  formatPatientDateTime,
  patientAgeFromBirthDate,
  patientInitials,
} from "@/lib/patients/patient-display";
import { cn } from "@/lib/utils";
import { PatientAddModal } from "./patient-add-modal";

const STATUS_LABEL: Record<PatientClinicalStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  archived: "Arquivado",
};

export function PatientWorkspaceShell({
  patientId,
  children,
}: {
  patientId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { patients, loading } = useSupabasePatients();
  const patient = patients.find((p) => p.id === patientId);
  const status = patient?.clinicalStatus ?? "active";
  const [addOpen, setAddOpen] = React.useState(false);

  const age = patient ? patientAgeFromBirthDate(patient.birthDate ?? null) : null;
  const lastTouch = patient?.updatedAt ?? patient?.createdAt;
  const phone = patient?.phone?.trim() || "—";
  const email = patient?.email ?? "—";

  return (
    <div className="space-y-4 pb-5">
      <div className="overflow-hidden rounded-lg border border-neutral-200/55 bg-gradient-to-br from-bg-0 via-primary/[0.04] to-yellow/[0.05] shadow-premium-sm ring-1 ring-black/[0.035]">
        <div className="border-b border-neutral-200/50 bg-bg-0/40 px-3 py-4 backdrop-blur-sm md:px-5 md:py-4">
          {loading && !patient ? (
            <p className="text-body14 font-semibold text-text-muted">Carregando ficha do paciente…</p>
          ) : patient ? (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-secondary/15 text-base font-semibold tracking-tight text-text-primary shadow-inner ring-1 ring-primary/15"
                  aria-hidden
                >
                  {patientInitials(patient.name)}
                </div>
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">Centro de comando clínico</p>
                    <h1 className="mt-0.5 break-words text-xl font-semibold tracking-tight text-text-primary md:text-[1.375rem]">
                      {patient.name}
                    </h1>
                  </div>
                  <div className="grid gap-x-5 gap-y-1.5 text-small12 font-medium sm:grid-cols-2">
                    <p className="text-text-secondary">
                      <span className="font-medium text-text-muted">Idade</span>{" "}
                      <span className="text-text-primary">{age !== null ? `${age} anos` : "—"}</span>
                    </p>
                    <p className="min-w-0 truncate text-text-secondary">
                      <span className="font-medium text-text-muted">E-mail</span>{" "}
                      <span className="text-text-primary">{email}</span>
                    </p>
                    <p className="text-text-secondary">
                      <span className="font-medium text-text-muted">Telefone / WhatsApp</span>{" "}
                      <span className="text-text-primary">{phone}</span>
                    </p>
                    <p className="text-text-secondary">
                      <span className="font-medium text-text-muted">Última atualização</span>{" "}
                      <span className="text-text-primary">{formatPatientDateTime(lastTouch, "—")}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <Chip tone={status === "active" ? "success" : status === "paused" ? "yellow" : "muted"}>
                      {STATUS_LABEL[status]}
                    </Chip>
                    <Chip tone={patient.portalAccessActive ? "primary" : "muted"}>
                      {patient.portalAccessActive ? "App: acesso liberado" : "App: acesso suspenso"}
                    </Chip>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col lg:items-stretch">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="px-5 shadow-premium-sm"
                  onClick={() => setAddOpen(true)}
                >
                  Adicionar
                </Button>
                <Link
                  href={`/patients/${patientId}/perfil`}
                  className={buttonClassName("outline", "md", "justify-center px-5")}
                >
                  Editar paciente
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-body14 font-bold text-orange">Paciente não encontrado nesta conta.</p>
          )}
        </div>

        <nav
          className="flex gap-1 overflow-x-auto px-2 py-2 md:gap-1.5 md:px-3 md:py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Seções do paciente"
        >
          {PATIENT_WORKSPACE_TABS.map((tab) => {
            const href = patientWorkspaceHref(patientId, tab.segment);
            const active =
              tab.segment === ""
                ? pathname === href || pathname === `${href}/`
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={tab.segment || "resumo"}
                href={href}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors md:px-3.5 md:text-small12 md:normal-case md:tracking-normal",
                  active
                    ? "bg-text-primary text-bg-0 shadow-sm ring-1 ring-primary/25"
                    : "bg-bg-0/90 text-text-secondary ring-1 ring-neutral-200/85 hover:bg-neutral-50 hover:text-text-primary",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <PatientAddModal open={addOpen} onClose={() => setAddOpen(false)} patientId={patientId} />

      <div className="min-h-[50vh]">{children}</div>
    </div>
  );
}
