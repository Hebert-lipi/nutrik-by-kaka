"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";

const routeTitle: Record<string, string> = {
  "/dashboard": "Painel",
  "/patients": "Pacientes",
  "/diet-plans": "Planos alimentares",
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPatientDietRoute = /\/patients\/[^/]+\/diet$/.test(pathname);
  const isPlanBuilderRoute = pathname.includes("/diet-plans/new") || /\/diet-plans\/[^/]+\/edit$/.test(pathname);

  let finalTitle = "Nutrik by Kaká";
  for (const [route, title] of Object.entries(routeTitle)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      finalTitle = title;
      break;
    }
  }

  if (isPlanBuilderRoute) finalTitle = "Construtor de plano";
  else if (isPatientDietRoute) finalTitle = "Cardápio saudável";

  return (
    <div className="min-h-dvh bg-bg-1">
      <div className="mx-auto flex max-w-[1440px] gap-5 px-4 py-4 md:gap-6 md:px-6 md:py-6">
        <Sidebar currentPath={pathname} />

        <div className={cn("min-w-0 flex-1")}>
          <Topbar title={finalTitle} currentPath={pathname} />
          <main className="mx-auto mt-5 w-full max-w-6xl pb-10 md:mt-8 md:pb-12">{children}</main>
        </div>
      </div>
    </div>
  );
}
