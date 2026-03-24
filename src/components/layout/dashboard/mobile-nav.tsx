"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NUTRIK_LOGO_PUBLIC_PATH } from "@/components/ui/nutrik-brand-image";
import { IconClose, IconMenu } from "./icons";
import { SidebarLogoutButton } from "./sidebar-logout-button";
import { useProfileRole } from "@/hooks/use-profile-role";

export function MobileNav({ currentPath }: { currentPath: string }) {
  const { isAdmin, loading } = useProfileRole();
  const [open, setOpen] = React.useState(false);

  const navItems = React.useMemo(() => {
    const base = [
      { href: "/dashboard", label: "Painel" },
      { href: "/patients", label: "Pacientes" },
      { href: "/diet-plans", label: "Biblioteca" },
    ];
    if (!loading && isAdmin) {
      base.push({ href: "/dashboard/solicitacoes-acesso", label: "Acesso profissional" });
    }
    base.push({ href: "/meu-plano", label: "Meu plano" });
    return base;
  }, [isAdmin, loading]);

  React.useEffect(() => {
    setOpen(false);
  }, [currentPath]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Abrir menu de navegação"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200/90 bg-bg-0 text-text-secondary shadow-sm [&_svg]:h-[17px] [&_svg]:w-[17px]"
      >
        <IconMenu className="text-neutral-600" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-neutral-900/45 backdrop-blur-[1px]"
            role="button"
            tabIndex={0}
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.key === "Enter" && setOpen(false)}
          />

          <div
            className={cn(
              "nutrik-sidebar-shell nutrik-sidebar-shell--drawer absolute left-3 right-3 top-3 flex max-h-[min(calc(100vh-1.5rem),36rem)] flex-col overflow-y-auto rounded-lg border-y border-l border-neutral-200/45 shadow-card",
            )}
          >
            <div className="relative z-[2] flex items-center justify-between gap-2 px-4 pb-6 pt-5">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={NUTRIK_LOGO_PUBLIC_PATH}
                  alt="Nutrik by Kaká"
                  width={464}
                  height={175}
                  decoding="async"
                  className="sidebar-brand-logo max-w-[min(100%,165px)]"
                />
              </Link>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200/70 bg-[#f7f9f7] text-neutral-500 [&_svg]:h-4 [&_svg]:w-4"
              >
                <IconClose className="text-neutral-500" />
              </button>
            </div>

            <nav className="relative z-[2] flex shrink-0 flex-col gap-1 px-4 pt-2 pb-2">
              {navItems.map((item) => {
                const active =
                  currentPath === item.href || currentPath.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-body14 font-medium transition-colors",
                      active
                        ? "bg-primary/15 font-semibold text-text-primary"
                        : "text-text-secondary hover:bg-neutral-100/90 hover:text-text-primary",
                    )}
                  >
                    <span>{item.label}</span>
                    {active ? (
                      <span className="text-secondary">●</span>
                    ) : (
                      <span className="text-transparent">●</span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="nutrik-sidebar-wellness relative z-[1] flex-1 min-h-[72px]" aria-hidden />

            <div className="relative z-[2] shrink-0 bg-white px-4 pb-3 pt-0.5">
              <SidebarLogoutButton onAfterSignOut={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
