"use client";

import * as React from "react";
import Link from "next/link";
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
  return (
    <header className="nutrik-print-hide z-30 shrink-0 px-1 pb-3 pt-1 md:px-0 md:pb-4 md:pt-0">
      <div className="rounded-2xl border border-neutral-200/65 bg-bg-0/96 shadow-[0_10px_40px_-18px_rgba(15,23,42,0.25)] ring-1 ring-black/[0.03] backdrop-blur-xl">
        <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5 md:py-3.5">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <MobileNav currentPath={currentPath} />
          {!compactTitle ? (
            <h1 className="min-w-0 truncate text-[1.45rem] font-extrabold leading-tight tracking-tight text-text-primary md:text-[1.6rem]">
              {title}
            </h1>
          ) : (
            <>
              <span className="sr-only">{title}</span>
              <span className="hidden min-w-0 truncate text-[1.1rem] font-bold text-text-muted md:block">Nutrik</span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="relative min-w-[200px] flex-1 md:max-w-[280px] md:flex-none">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden>
              <IconSearch className="text-neutral-500" />
            </span>
            <input
              type="search"
              placeholder="Buscar pacientes, planos…"
              className="h-11 w-full rounded-full border border-neutral-200/80 bg-neutral-50/90 pl-10 pr-4 text-sm text-text-primary outline-none transition-all placeholder:text-neutral-400 focus:border-primary/25 focus:bg-bg-0 focus:ring-2 focus:ring-primary/15"
              readOnly
              aria-label="Busca"
            />
          </div>
          <Link
            href="/meu-plano"
            className="hidden rounded-full border border-neutral-200/80 px-3 py-2 text-[11px] font-extrabold text-secondary transition-colors hover:border-primary/25 hover:bg-primary/[0.06] sm:inline-block"
          >
            Meu plano
          </Link>
          <button
            type="button"
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200/80 bg-bg-0 text-text-secondary shadow-sm transition-colors hover:bg-neutral-50"
            aria-label="Notificações"
          >
            <IconBell className="text-neutral-600" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange ring-2 ring-bg-0" />
          </button>
          <div className="hidden items-center gap-3 rounded-full border border-neutral-200/70 bg-gradient-to-r from-neutral-50/90 to-bg-0 py-1.5 pl-1.5 pr-3 sm:flex">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/35 to-secondary/25 text-small12 font-bold text-text-primary ring-2 ring-bg-0"
              aria-hidden
            >
              NK
            </span>
            <div className="text-left">
              <p className="text-small12 font-bold text-text-primary">Perfil</p>
              <p className="text-[11px] font-medium text-text-muted">Nutricionista</p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </header>
  );
}
