"use client";

import type { ActivityItem } from "@/lib/dashboard-insights";
import { cn } from "@/lib/utils";

const ring: Record<ActivityItem["variant"], string> = {
  primary: "border-l-primary bg-primary/[0.04]",
  yellow: "border-l-yellow bg-yellow/[0.06]",
  neutral: "border-l-neutral-300 bg-neutral-50/50",
  orange: "border-l-orange bg-orange/[0.05]",
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className={cn(
            "group rounded-xl border border-neutral-100/90 border-l-4 py-3 pl-4 pr-3 transition-all duration-200 hover:border-neutral-200 hover:shadow-md",
            ring[item.variant],
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-small12 font-semibold text-text-primary">{item.title}</p>
              {item.subtitle ? (
                <p className="mt-0.5 truncate text-[11px] font-semibold text-text-secondary">{item.subtitle}</p>
              ) : null}
            </div>
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-text-muted">{item.time}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
