"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/brand-logo";
import { IconClose, IconMenu } from "./icons";

const navItems = [
  { href: "/dashboard", label: "Painel" },
  { href: "/patients", label: "Pacientes" },
  { href: "/diet-plans", label: "Planos" },
  { href: "/meu-plano", label: "Meu plano" },
];

export function MobileNav({ currentPath }: { currentPath: string }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [currentPath]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Abrir menu de navegação"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200/90 bg-bg-0 text-text-secondary shadow-sm"
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

          <div className="absolute left-3 right-3 top-3 rounded-2xl border border-neutral-200/80 bg-bg-0 p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BrandLogo size={36} />
                <div>
                  <p className="text-body14 font-extrabold text-text-primary">Nutrik</p>
                  <p className="text-small12 font-medium text-text-muted">by Kaká</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200/90 bg-bg-0 text-text-secondary"
              >
                <IconClose className="text-neutral-600" />
              </button>
            </div>

            <nav className="mt-4 space-y-1">
              {navItems.map((item) => {
                const active =
                  currentPath === item.href || currentPath.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-3 py-3 text-body14 font-semibold transition-colors",
                      active
                        ? "border-primary/25 bg-primary/12 text-text-primary"
                        : "border-neutral-200/80 bg-bg-0 text-text-secondary hover:bg-neutral-50",
                    )}
                  >
                    <span>{item.label}</span>
                    {active ? <span className="text-primary">●</span> : <span className="text-transparent">●</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
