import type { ReactNode } from "react";
import patientPortalBg from "@/assets/patient-portal-bg.png";
import { PatientPortalHeader } from "@/components/patient-portal/patient-portal-header";
import { PatientBottomNavigation } from "@/components/patient-portal/patient-bottom-navigation";

/**
 * Experiência do paciente: header com logo, conta, perfil e sair; faixa contextual para nutricionista em modo paciente.
 */
export default function PatientPortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate min-h-dvh overflow-x-hidden">
      {/* Camada fixa: import garante URL no build (PWA/offline); evita 404 em /public se faltar deploy. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0.58) 0%, rgba(255,255,253,0.42) 48%, rgba(250,250,248,0.55) 100%), url(${patientPortalBg.src})`,
          backgroundSize: "cover, cover",
          backgroundPosition: "center, right bottom",
          backgroundRepeat: "no-repeat, no-repeat",
        }}
      />
      <PatientPortalHeader />
      <div className="relative z-[1] mx-auto max-w-4xl px-4 pb-[max(5.75rem,calc(env(safe-area-inset-bottom)+5rem))] pt-5 sm:px-5 sm:pt-7 md:px-6 md:pt-10">
        {children}
      </div>
      <PatientBottomNavigation />
    </div>
  );
}
