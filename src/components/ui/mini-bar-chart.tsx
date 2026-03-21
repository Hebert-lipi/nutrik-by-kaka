"use client";

import { cn } from "@/lib/utils";

export function MiniBarChart({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className={cn("flex h-24 items-end justify-between gap-1.5 px-1", className)} role="img" aria-label="Barras de novos cadastros por dia">
      {values.map((v, i) => {
        const pct = (v / max) * 100;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-primary/50 to-primary transition-all duration-500 hover:from-primary/70 hover:to-primary/90"
                style={{ height: `${Math.max(8, pct)}%` }}
              />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted">{i + 1}d</span>
          </div>
        );
      })}
    </div>
  );
}
