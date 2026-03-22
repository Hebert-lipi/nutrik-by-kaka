"use client";

import Link from "next/link";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { NUTRIK_LOGO_PUBLIC_PATH } from "@/components/ui/nutrik-brand-image";
import { IconDashboard, IconDietPlan, IconUsers } from "./icons";
import { SidebarLogoutButton } from "./sidebar-logout-button";

export type SidebarItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export function Sidebar({ currentPath }: { currentPath: string }) {
  const items: SidebarItem[] = useMemo(
    () => [
      { href: "/dashboard", label: "Painel", icon: <IconDashboard className="shrink-0" /> },
      { href: "/patients", label: "Pacientes", icon: <IconUsers className="shrink-0" /> },
      { href: "/diet-plans", label: "Biblioteca", icon: <IconDietPlan className="shrink-0" /> },
    ],
    [],
  );

  return (
    <aside className="nutrik-print-hide hidden h-full min-h-0 w-[264px] shrink-0 md:flex md:flex-col">
      <div
        className={cn(
          "nutrik-sidebar-shell flex h-full min-h-0 flex-col overflow-hidden rounded-2xl",
          "border border-neutral-200/55 shadow-premium-sm",
        )}
      >
        {/* Topo da marca — respiro superior + espaço até ao menu */}
        <div className="relative z-[2] shrink-0 pl-3 pr-3 pt-4 pb-6">
          <Link
            href="/dashboard"
            className="block w-full max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={NUTRIK_LOGO_PUBLIC_PATH}
              alt="Nutrik by Kaká"
              width={464}
              height={175}
              decoding="async"
              loading="eager"
              className="sidebar-brand-logo"
            />
          </Link>
        </div>

        {/* Navegação — compacta; fluxo contínuo até à ilustração */}
        <nav
          className="relative z-[2] flex shrink-0 flex-col gap-1.5 px-3 pt-2 pb-1.5"
          aria-label="Navegação principal"
        >
          {items.map((item) => {
            const active = currentPath === item.href || currentPath.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] leading-none transition-all duration-200",
                  active
                    ? "bg-primary/15 font-semibold text-text-primary"
                    : "font-medium text-text-secondary hover:bg-neutral-100/90 hover:text-text-primary",
                )}
              >
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center text-text-secondary transition-colors [&_svg]:h-[17px] [&_svg]:w-[17px]",
                    active ? "text-text-primary" : "group-hover:text-text-primary",
                  )}
                >
                  {item.icon}
                </span>

                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Ilustração: integração premium (globals.css — gradiente + ::before overlay + ::after com mask fade) */}
        <div className="nutrik-sidebar-wellness relative z-[1] min-h-0" aria-hidden />

        {/* Rodapé — sair (estilo pill premium) */}
        <div className="relative z-[2] shrink-0 bg-white px-3 pb-3 pt-0.5">
          <SidebarLogoutButton />
        </div>
      </div>
    </aside>
  );
}
