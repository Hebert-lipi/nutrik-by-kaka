"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NutritionistBootstrap } from "./nutritionist-bootstrap";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const routeTitle: Record<string, string> = {
  "/dashboard": "Painel",
  "/patients": "Pacientes",
  "/diet-plans": "Planos alimentares",
};

/**
 * Shell tipo app: viewport fixa, sidebar e topbar estáveis, apenas o main rola.
 * Evita sidebar/topbar “subindo” com o documento e desalinhamento no fim da página.
 */
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPatientDietRoute = /\/patients\/[^/]+\/diet$/.test(pathname);
  const isPatientDetailRoute = /^\/patients\/[^/]+$/.test(pathname);
  const isPlanBuilderRoute = pathname.includes("/diet-plans/new") || /\/diet-plans\/[^/]+\/edit$/.test(pathname);

  let finalTitle = "Nutrik by Kaká";
  for (const [route, title] of Object.entries(routeTitle)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      finalTitle = title;
      break;
    }
  }

  if (isPlanBuilderRoute) finalTitle = "Construtor de plano";
  else if (isPatientDietRoute) finalTitle = "Pré-visualização do plano";
  else if (isPatientDetailRoute) finalTitle = "Ficha do paciente";

  const compactTopbarTitle = pathname === "/dashboard";

  return (
    <div className="box-border flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-bg-1 md:flex-row md:gap-5 md:p-5">
      <Sidebar currentPath={pathname} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar title={finalTitle} currentPath={pathname} compactTitle={compactTopbarTitle} />
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          <div
            className={cn(
              "mx-auto w-full max-w-6xl px-4 pt-5 md:px-6 md:pt-6",
              isPlanBuilderRoute ? "pb-6 md:pb-8" : "pb-10 md:pb-12",
            )}
          >
            <NutritionistBootstrap>{children}</NutritionistBootstrap>
          </div>
        </main>
      </div>
    </div>
  );
}
