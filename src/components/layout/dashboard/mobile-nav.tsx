"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconClose, IconMenu } from "./icons";

const navItems = [
  { href: "/dashboard", label: "Painel" },
  { href: "/patients", label: "Pacientes" },
  { href: "/diet-plans", label: "Planos" },
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
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-bg-0 shadow-soft border border-neutral-200 text-text-secondary"
      >
        <IconMenu className="text-neutral-600" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-neutral-900/40"
            role="button"
            tabIndex={0}
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-3 right-3 top-3 rounded-xl border border-neutral-200/80 bg-bg-0 p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body14 font-extrabold text-text-primary">Nutrik</p>
                <p className="text-small12 text-text-muted">by Kaká</p>
              </div>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-bg-0 text-text-secondary"
              >
                <IconClose className="text-neutral-600" />
              </button>
            </div>

            <nav className="mt-3 space-y-1">
              {navItems.map((item) => {
                const active =
                  currentPath === item.href || currentPath.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-body14 font-semibold transition-colors border",
                      active
                        ? "bg-primary/15 text-primary border-primary/20"
                        : "bg-bg-0 text-text-secondary border-neutral-200 hover:bg-neutral-100/70",
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

