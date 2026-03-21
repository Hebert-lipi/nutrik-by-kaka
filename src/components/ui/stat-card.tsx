import * as React from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  meta,
  icon,
  iconClassName,
  className,
}: {
  title: string;
  value: string;
  meta?: React.ReactNode;
  icon?: React.ReactNode;
  iconClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200/60 bg-bg-0 p-5 shadow-soft ring-1 ring-black/[0.025]",
        "transition-shadow duration-300 hover:shadow-card",
        className,
      )}
    >
      <div className="flex gap-4">
        {icon ? (
          <div
            className={cn(
              "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl",
              iconClassName ?? "bg-primary/[0.14] text-primary",
            )}
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">{title}</p>
          <p className="mt-2 tabular-nums text-[1.75rem] font-extrabold leading-none tracking-tight text-text-primary md:text-[2rem]">
            {value}
          </p>
          {meta ? <div className="mt-2.5">{meta}</div> : null}
        </div>
      </div>
    </div>
  );
}
