"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MobileNav } from "./mobile-nav";
import { IconBell, IconSearch } from "./icons";

export function Topbar({
  title,
  currentPath,
  compactTitle = false,
}: {
  title: string;
  currentPath: string;
  compactTitle?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setQuery((prev) => (prev === q ? prev : q));
  }, [searchParams]);

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const next = query.trim();
      if (next) params.set("q", next);
      else params.delete("q");
      const qs = params.toString();
      const nextUrl = qs ? `${pathname}?${qs}` : pathname;
      const currentQs = searchParams.toString();
      const currentUrl = currentQs ? `${pathname}?${currentQs}` : pathname;
      if (nextUrl !== currentUrl) {
        router.replace(nextUrl);
      }
    }, 250);
    return () => window.clearTimeout(id);
  }, [pathname, query, router, searchParams]);

  return (
    <header className="nutrik-print-hide z-30 shrink-0 px-1 pb-2 pt-1 md:px-0 md:pb-3 md:pt-0">
      <div className="rounded-lg border border-neutral-200/65 bg-bg-0/96 shadow-premium-sm ring-1 ring-black/[0.025] backdrop-blur-xl">
        <div className="flex flex-col gap-2 px-3 py-2 md:flex-row md:items-center md:justify-between md:px-4 md:py-2.5">
          <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
          <MobileNav currentPath={currentPath} />
          {!compactTitle ? (
            <h1 className="min-w-0 truncate text-lg font-semibold leading-tight tracking-tight text-text-primary md:text-xl">
              {title}
            </h1>
          ) : (
            <>
              <span className="sr-only">{title}</span>
              <span className="hidden min-w-0 truncate text-sm font-medium text-text-muted md:block">Nutrik</span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
          <div className="relative min-w-[180px] flex-1 md:max-w-[260px] md:flex-none">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 [&_svg]:h-[17px] [&_svg]:w-[17px]" aria-hidden>
              <IconSearch className="text-neutral-500" />
            </span>
            <input
              type="search"
              placeholder="Buscar pacientes, planos…"
              className="h-9 w-full rounded-md border border-neutral-200/80 bg-neutral-50/90 pl-9 pr-3 text-body14 text-text-primary outline-none transition-all placeholder:text-neutral-400 focus:border-primary/25 focus:bg-bg-0 focus:ring-2 focus:ring-primary/12"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Busca"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-text-muted transition-colors hover:bg-neutral-100 hover:text-text-primary"
                aria-label="Limpar busca"
              >
                Limpar
              </button>
            ) : null}
          </div>
          <Link
            href="/meu-plano"
            className="hidden rounded-md border border-neutral-200/80 px-2.5 py-1.5 text-[11px] font-semibold text-secondary transition-colors hover:border-primary/25 hover:bg-primary/[0.06] sm:inline-block"
          >
            Meu plano
          </Link>
          <Link
            href="/dashboard/performance"
            className="hidden rounded-md border border-neutral-200/80 px-2.5 py-1.5 text-[11px] font-semibold text-text-secondary transition-colors hover:border-primary/25 hover:bg-primary/[0.06] lg:inline-block"
          >
            Performance
          </Link>
          <button
            type="button"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-200/80 bg-bg-0 text-text-secondary shadow-sm transition-colors hover:bg-neutral-50 [&_svg]:h-[17px] [&_svg]:w-[17px]"
            aria-label="Notificações"
          >
            <IconBell className="text-neutral-600" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-orange ring-2 ring-bg-0" />
          </button>
          <div className="hidden items-center gap-2 rounded-md border border-neutral-200/70 bg-gradient-to-r from-neutral-50/90 to-bg-0 py-1 pl-1 pr-2.5 sm:flex">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary/35 to-secondary/25 text-[11px] font-semibold text-text-primary ring-1 ring-bg-0"
              aria-hidden
            >
              NK
            </span>
            <div className="text-left">
              <p className="text-[11px] font-semibold text-text-primary">Perfil</p>
              <p className="text-[10px] font-medium text-text-muted">Nutricionista</p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </header>
  );
}
