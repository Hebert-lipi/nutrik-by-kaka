import * as React from "react";
import { MobileNav } from "./mobile-nav";
import { IconBell, IconSearch } from "./icons";

export function Topbar({ title, currentPath }: { title: string; currentPath: string }) {
  return (
    <header className="sticky top-0 z-20">
      <div className="-mx-4 rounded-2xl border border-neutral-200/50 bg-bg-0/90 shadow-soft ring-1 ring-black/[0.02] backdrop-blur-md md:mx-0">
        <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 md:py-5">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <MobileNav currentPath={currentPath} />
            <h1 className="min-w-0 truncate text-[1.5rem] font-extrabold leading-tight tracking-tight text-text-primary md:text-[1.625rem]">
              {title}
            </h1>
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
