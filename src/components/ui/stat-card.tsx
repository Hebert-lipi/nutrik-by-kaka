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
    <div className={cn("rounded-xl border border-neutral-200 bg-bg-0 p-4 shadow-soft", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-small12 font-semibold text-text-secondary">{title}</p>
          <p className="mt-2 text-h3 font-extrabold">{value}</p>
        </div>
        {meta ? <div className="mt-1">{meta}</div> : null}
      </div>
    </div>
  );
}

