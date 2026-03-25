"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NutrikBrandImage } from "@/components/ui/nutrik-brand-image";
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
        "sticky top-0 z-20 touch-manipulation backdrop-blur-md pt-[env(safe-area-inset-top)]",
        isNutritionist
          ? "bg-amber-50/90 shadow-[0_2px_0_rgba(180,83,9,0.12)]"
          : "bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.05)]",
      )}
    >
      {isNutritionist ? (
        <div className="border-b border-amber-300/55 bg-gradient-to-b from-amber-50 via-amber-50 to-amber-100/70 px-3 py-4 ring-1 ring-amber-200/40 md:px-6 md:py-4">
          <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
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
          <Link
            href="/meu-plano"
            className="min-w-0 shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
          >
            <NutrikBrandImage
              priority
              className="h-7 w-auto max-w-[min(100%,11rem)] object-contain object-left sm:h-8 md:h-10"
            />
          </Link>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-3">
            <div className="min-w-0 max-w-[min(48vw,14rem)] text-right sm:max-w-[16rem]">
              {ctx === undefined ? (
                <p className="truncate text-sm font-medium text-text-muted">A carregar…</p>
              ) : ctx === null ? (
                <p className="truncate text-sm font-medium text-text-muted">Sessão</p>
              ) : (
                <p className="truncate text-sm font-semibold text-text-primary sm:text-[15px]">
                  Olá, <span className="text-secondary">{greeting}</span>
                </p>
              )}
              <p className="hidden truncate text-[11px] font-medium text-text-muted sm:block">Seu plano alimentar</p>
            </div>

            <div className="relative shrink-0" ref={menuRef}>
              <Button
                type="button"
                variant="outline"
                size="md"
                className="min-h-11 min-w-[3.25rem] px-3 text-xs sm:min-h-9 sm:min-w-0 sm:px-3.5 sm:text-sm"
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
                  className="absolute right-0 z-30 mt-2 min-w-[12.5rem] rounded-xl border border-neutral-200/90 bg-bg-0 py-1 shadow-lg ring-1 ring-black/[0.04]"
                >
                  <Link
                    role="menuitem"
                    href="/perfil"
                    className="block min-h-11 px-3 py-3 text-[14px] font-medium text-text-primary hover:bg-neutral-50 sm:min-h-0 sm:py-2.5 sm:text-[13px]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Perfil
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={signingOut}
                    className={cn(
                      "block min-h-11 w-full px-3 py-3 text-left text-[14px] font-medium text-text-primary hover:bg-neutral-50 sm:min-h-0 sm:py-2.5 sm:text-[13px]",
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
        </div>
      </header>
    </div>
  );
}
