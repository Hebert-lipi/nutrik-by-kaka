import * as React from "react";
import { MobileNav } from "./mobile-nav";

export function Topbar({ title, currentPath }: { title: string; currentPath: string }) {
  return (
    <header className="sticky top-0 z-20 -mx-4 rounded-xl border border-neutral-200/80 bg-bg-0/90 shadow-sm backdrop-blur-md md:static md:mx-0">
      <div className="flex items-center justify-between gap-4 px-4 py-3.5 md:px-5 md:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNav currentPath={currentPath} />
          <div className="min-w-0">
            <p className="text-small12 font-semibold uppercase tracking-wide text-text-muted">Área logada</p>
            <h1 className="truncate text-title18 font-extrabold text-text-primary">{title}</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-3 rounded-xl border border-neutral-200/80 bg-neutral-50/50 px-3 py-2 sm:flex">
            <div className="text-right">
              <p className="text-small12 font-semibold text-text-primary">Conta</p>
              <p className="text-small12 text-text-muted">Nutricionista</p>
            </div>
            <span
              className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/25 to-primary/10 ring-2 ring-bg-0"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </header>
  );
}

