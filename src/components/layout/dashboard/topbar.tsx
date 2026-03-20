import * as React from "react";
import { MobileNav } from "./mobile-nav";

export function Topbar({ title, currentPath }: { title: string; currentPath: string }) {
  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-neutral-200/60 bg-bg-0/75 backdrop-blur md:static md:mx-0">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:py-4">
        <div className="flex items-center gap-3">
          <MobileNav currentPath={currentPath} />
          <div>
            <h1 className="text-body16Semi font-extrabold text-text-primary">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-neutral-200 bg-bg-0 px-3 py-2">
            <span className="text-small12 font-semibold text-text-secondary">Nutritionist</span>
            <span className="h-8 w-8 rounded-full bg-primary/15 border border-primary/20" />
          </div>
        </div>
      </div>
    </header>
  );
}

