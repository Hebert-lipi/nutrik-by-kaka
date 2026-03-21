import * as React from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  meta,
  className,
}: {
  title: string;
  value: string;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200/80 bg-bg-0 p-5 shadow-soft ring-1 ring-neutral-900/[0.02]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-small12 font-semibold uppercase tracking-wide text-text-muted">{title}</p>
          <p className="mt-3 text-h2 font-extrabold tracking-tight text-text-primary">{value}</p>
        </div>
        {meta ? <div className="shrink-0 text-right">{meta}</div> : null}
      </div>
    </div>
  );
}

