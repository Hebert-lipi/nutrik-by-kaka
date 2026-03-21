import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/ui/brand-logo";

/**
 * Experiência do paciente: sem sidebar clínica.
 * Futuro: role `patient` no JWT + redirecionamento pós-login só para esta árvore.
 */
export default function PatientPortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-bg-1 via-bg-1 to-[rgb(var(--color-neutral-50))]">
      <header className="sticky top-0 z-20 px-3 pb-3 pt-3 md:px-6 md:pb-4 md:pt-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-2xl border border-neutral-200/65 bg-bg-0/96 px-4 py-3 shadow-[0_10px_40px_-18px_rgba(15,23,42,0.2)] ring-1 ring-black/[0.03] backdrop-blur-xl md:px-5">
          <div className="flex items-center gap-3">
            <BrandLogo size={40} />
            <div>
              <p className="font-extrabold tracking-tight text-text-primary">Nutrik by Kaká</p>
              <p className="text-small12 font-medium text-text-muted">Seu plano alimentar</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="text-[11px] font-extrabold uppercase tracking-wide text-secondary underline-offset-4 hover:underline"
          >
            Área da nutricionista
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">{children}</div>
    </div>
  );
}
