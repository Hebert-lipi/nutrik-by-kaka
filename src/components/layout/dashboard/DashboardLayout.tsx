"use client";

import * as React from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NutritionistBootstrap } from "./nutritionist-bootstrap";
import { RoutePerfTracker } from "@/components/perf/route-perf-tracker";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const routeTitle: Record<string, string> = {
  "/dashboard": "Painel",
  "/patients": "Pacientes",
  "/diet-plans": "Biblioteca de planos",
};

/**
 * Shell tipo app: viewport fixa, sidebar e topbar estáveis, apenas o main rola.
 * Evita sidebar/topbar “subindo” com o documento e desalinhamento no fim da página.
 */
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPatientWorkspaceRoute = /^\/patients\/[^/]+/.test(pathname) && pathname !== "/patients";
  const isPlanBuilderRoute = pathname.includes("/diet-plans/new") || /\/diet-plans\/[^/]+\/edit$/.test(pathname);

  let finalTitle = "Nutrik by Kaká";
  for (const [route, title] of Object.entries(routeTitle)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      finalTitle = title;
      break;
    }
  }

  if (isPlanBuilderRoute) finalTitle = "Construtor de plano";
  else if (isPatientWorkspaceRoute) finalTitle = "Área do paciente";

  const compactTopbarTitle = pathname === "/dashboard";

  React.useEffect(() => {
    document.body.classList.add("nutrik-dashboard-shell");
    document.documentElement.classList.add("nutrik-dashboard-shell-root");
    return () => {
      document.body.classList.remove("nutrik-dashboard-shell");
      document.documentElement.classList.remove("nutrik-dashboard-shell-root");
    };
  }, []);

  return (
    <div className="box-border flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-bg-1 md:flex-row md:gap-4 md:p-4">
      <RoutePerfTracker />
      <Sidebar currentPath={pathname} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Suspense
          fallback={
            <div className="nutrik-print-hide z-30 shrink-0 px-1 pb-2 pt-1 md:px-0 md:pb-3 md:pt-0">
              <div className="h-[56px] rounded-lg border border-neutral-200/65 bg-bg-0/96 shadow-premium-sm ring-1 ring-black/[0.025]" />
            </div>
          }
        >
          <Topbar title={finalTitle} currentPath={pathname} compactTitle={compactTopbarTitle} />
        </Suspense>
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          <div
            className={cn(
              "mx-auto w-full min-w-0 max-w-6xl px-3 pt-4 md:px-5 md:pt-5",
              isPlanBuilderRoute ? "pb-5 md:pb-6" : "pb-8 md:pb-9",
            )}
          >
            <NutritionistBootstrap>{children}</NutritionistBootstrap>
          </div>
        </main>
      </div>
    </div>
  );
}
