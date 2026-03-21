"use client";

import Link from "next/link";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/brand-logo";
import { IconDashboard, IconDietPlan, IconUsers } from "./icons";

export type SidebarItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export function Sidebar({ currentPath }: { currentPath: string }) {
  const items: SidebarItem[] = useMemo(
    () => [
      { href: "/dashboard", label: "Painel", icon: <IconDashboard className="h-5 w-5 shrink-0" /> },
      { href: "/patients", label: "Pacientes", icon: <IconUsers className="h-5 w-5 shrink-0" /> },
      { href: "/diet-plans", label: "Planos", icon: <IconDietPlan className="h-5 w-5 shrink-0" /> },
    ],
    [],
  );

  return (
    <aside className="nutrik-print-hide hidden h-full min-h-0 w-[272px] shrink-0 md:flex md:flex-col">
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-neutral-200/50 bg-bg-0/95 shadow-card ring-1 ring-black/[0.02] backdrop-blur-sm">
        <div className="shrink-0 border-b border-neutral-100/90 p-4 pb-4">
          <div className="flex items-center gap-3">
            <BrandLogo size={44} />
            <div className="min-w-0">
              <p className="truncate font-extrabold tracking-tight text-text-primary">Nutrik</p>
              <p className="truncate text-small12 font-medium text-text-muted">by Kaká</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-3 pt-4" aria-label="Navegação principal">
          {items.map((item) => {
            const active = currentPath === item.href || currentPath.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-body14 font-semibold transition-all duration-200",
                  active
                    ? "bg-primary/[0.14] text-text-primary shadow-sm ring-1 ring-primary/20"
                    : "text-text-secondary hover:bg-neutral-50 hover:text-text-primary",
                )}
              >
                <span className={cn(active ? "text-primary" : "text-neutral-500")}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-neutral-100/80 p-4 pt-3">
          <p className="px-1 text-[11px] font-medium leading-relaxed text-text-muted/90">
            Área clínica · sessão segura
          </p>
        </div>
      </div>
    </aside>
  );
}
