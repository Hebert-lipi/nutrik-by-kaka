"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NutrikLogoMark } from "@/components/auth/nutrik-logo-mark";
import { Button, buttonClassName } from "@/components/ui/button";
import {
  fetchPatientPortalNavContext,
  type PatientPortalNavContext,
} from "@/lib/auth/patient-portal-nav";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

export function PatientPortalHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [ctx, setCtx] = React.useState<PatientPortalNavContext | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await fetchPatientPortalNavContext(supabase);
      if (!cancelled) setCtx(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  React.useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      setMenuOpen(false);
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  const isNutritionist = ctx?.isNutritionist === true;
  const greeting = ctx?.greetingName ?? "";

  return (
    <div
      className={cn(
        "sticky top-0 z-20 backdrop-blur-md",
        isNutritionist
          ? "bg-amber-50/90 shadow-[0_2px_0_rgba(180,83,9,0.12)]"
          : "bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.05)]",
      )}
    >
      {isNutritionist ? (
        <div className="border-b border-amber-300/55 bg-gradient-to-b from-amber-50 via-amber-50 to-amber-100/70 px-3 py-4 ring-1 ring-amber-200/40 md:px-6 md:py-4">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0 space-y-1.5">
              <p className="text-[15px] font-semibold leading-snug tracking-tight text-amber-950">
                Você está visualizando como paciente
              </p>
              <p className="max-w-xl text-[13px] font-medium leading-relaxed text-amber-900/85">
                Essa é a visão que seus pacientes têm do plano
              </p>
            </div>
            <Link
              href="/dashboard"
              className={buttonClassName(
                "primary",
                "md",
                "inline-flex w-full shrink-0 items-center justify-center gap-2 shadow-md ring-1 ring-black/[0.06] sm:w-auto",
              )}
            >
              <span className="text-lg font-semibold leading-none" aria-hidden>
                ←
              </span>
              Voltar ao painel profissional
            </Link>
          </div>
        </div>
      ) : null}

      <header className="px-3 pb-3 pt-3 md:px-6 md:pb-4 md:pt-4">
        <div
          className={cn(
            "mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm ring-1 backdrop-blur-xl md:gap-4 md:px-5",
            isNutritionist
              ? "border-amber-200/50 bg-white/95 ring-amber-100/30"
              : "border-neutral-200/50 bg-white/98 ring-black/[0.02]",
          )}
        >
          <Link href="/meu-plano" className="min-w-0 shrink-0">
            <NutrikLogoMark className="flex items-center gap-2" />
          </Link>

          <div className="min-w-0 flex-1">
            {ctx === undefined ? (
              <p className="truncate text-sm font-medium text-text-muted">A carregar…</p>
            ) : ctx === null ? (
              <p className="truncate text-sm font-medium text-text-muted">Sessão</p>
            ) : (
              <p className="truncate text-sm font-semibold text-text-primary">
                Olá, <span className="text-secondary">{greeting}</span>
              </p>
            )}
            <p className="text-[11px] font-medium text-text-muted">Seu plano alimentar</p>
          </div>

          <div className="relative shrink-0" ref={menuRef}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Abrir menu da conta"
              onClick={() => setMenuOpen((o) => !o)}
            >
              Menu
            </Button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 mt-2 min-w-[11rem] rounded-xl border border-neutral-200/90 bg-bg-0 py-1 shadow-lg ring-1 ring-black/[0.04]"
              >
                <Link
                  role="menuitem"
                  href="/perfil"
                  className="block px-3 py-2.5 text-[13px] font-medium text-text-primary hover:bg-neutral-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Perfil
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  disabled={signingOut}
                  className={cn(
                    "block w-full px-3 py-2.5 text-left text-[13px] font-medium text-text-primary hover:bg-neutral-50",
                    "disabled:pointer-events-none disabled:opacity-50",
                  )}
                  onClick={() => void handleSignOut()}
                >
                  {signingOut ? "A sair…" : "Sair"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
    </div>
  );
}
