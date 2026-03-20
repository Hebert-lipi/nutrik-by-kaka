"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";

const routeTitle: Record<string, string> = {
  "/dashboard": "Nutrik by Kaká",
  "/patients": "Patients",
  "/diet-plans": "Diet Plans",
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDietRoute = pathname.includes("/diet");

  let finalTitle = "Nutrik by Kaká";
  for (const [route, title] of Object.entries(routeTitle)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      finalTitle = title;
      break;
    }
  }

  if (isDietRoute) finalTitle = "Healthy Menu";

  return (
    <div className="min-h-dvh bg-bg-1">
      <div className="mx-auto flex max-w-[1440px] gap-4 px-4 py-4 md:px-6 md:py-6">
        <Sidebar currentPath={pathname} mode={isDietRoute ? "diet" : "dashboard"} />

        <div className={cn("min-w-0 flex-1")}>
          {!isDietRoute ? <Topbar title={finalTitle} currentPath={pathname} /> : null}
          <main className={cn(isDietRoute ? "mt-0" : "mt-4 md:mt-6", "pb-10")}>{children}</main>
        </div>
      </div>
    </div>
  );
}

