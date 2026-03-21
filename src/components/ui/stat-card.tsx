import * as React from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  meta,
  trend,
  icon,
  iconClassName,
  className,
}: {
  title: string;
  value: string;
  meta?: React.ReactNode;
  /** Selo ao lado do valor (ex.: +12%) */
  trend?: React.ReactNode;
  icon?: React.ReactNode;
  iconClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200/45 bg-gradient-to-br from-bg-0 via-bg-0 to-neutral-50/30 p-5 shadow-premium-sm ring-1 ring-black/[0.035]",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-premium hover:ring-primary/10",
        className,
      )}
    >
      <div className="flex gap-4">
        {icon ? (
          <div
            className={cn(
              "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl shadow-inner",
              iconClassName ?? "bg-primary/[0.14] text-primary",
            )}
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-text-muted">{title}</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <p className="tabular-nums text-[1.75rem] font-extrabold leading-none tracking-tight text-text-primary md:text-[2rem]">
              {value}
            </p>
            {trend ? <span className="shrink-0">{trend}</span> : null}
          </div>
          {meta ? <div className="mt-2.5">{meta}</div> : null}
        </div>
      </div>
    </div>
  );
}
