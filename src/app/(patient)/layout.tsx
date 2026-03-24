import type { ReactNode } from "react";
import { NutrikLogoMark } from "@/components/auth/nutrik-logo-mark";

/**
 * Experiência do paciente: sem sidebar clínica; sem CTAs de área profissional (entrar como nutricionista só no login).
 */
export default function PatientPortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-bg-1 via-bg-1 to-[rgb(var(--color-neutral-50))]">
      <header className="sticky top-0 z-20 px-3 pb-3 pt-3 md:px-6 md:pb-4 md:pt-4">
        <div className="mx-auto flex max-w-3xl items-center gap-4 rounded-2xl border border-neutral-200/65 bg-bg-0/96 px-4 py-3 shadow-[0_10px_40px_-18px_rgba(15,23,42,0.2)] ring-1 ring-black/[0.03] backdrop-blur-xl md:px-5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <NutrikLogoMark className="flex items-center gap-2" />
            <p className="text-[11px] font-medium text-text-muted">Seu plano alimentar</p>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">{children}</div>
    </div>
  );
}
