import type { ReactNode } from "react";
import { PatientPortalHeader } from "@/components/patient-portal/patient-portal-header";

/**
 * Experiência do paciente: header com logo, conta, perfil e sair; faixa contextual para nutricionista em modo paciente.
 */
export default function PatientPortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-white via-[rgb(var(--color-neutral-50))] to-neutral-100/40">
      <PatientPortalHeader />
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">{children}</div>
    </div>
  );
}
