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
        "rounded-lg border border-neutral-200/45 bg-gradient-to-br from-bg-0 via-bg-0 to-neutral-50/30 p-4 shadow-premium-sm ring-1 ring-black/[0.03]",
        "transition-shadow duration-200 hover:shadow-premium hover:ring-primary/8",
        className,
      )}
    >
      <div className="flex gap-3">
        {icon ? (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-md shadow-inner [&_svg]:h-[18px] [&_svg]:w-[18px]",
              iconClassName ?? "bg-primary/[0.14] text-primary",
            )}
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted">{title}</p>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
            <p className="tabular-nums text-2xl font-semibold leading-none tracking-tight text-text-primary md:text-[1.65rem]">
              {value}
            </p>
            {trend ? <span className="shrink-0">{trend}</span> : null}
          </div>
          {meta ? <div className="mt-2">{meta}</div> : null}
        </div>
      </div>
    </div>
  );
}
