import * as React from "react";
import { cn } from "@/lib/utils";

/** Marca abstrata próxima às referências (arcos verde-lima + coral). */
export function BrandLogo({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width="40" height="40" rx="14" fill="rgb(var(--color-bg-0))" />
      <path
        d="M8 24c2.5-6 7.5-10 12-10s9.5 4 12 10"
        stroke="rgb(var(--color-primary))"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M10 26c2-4 5.5-6.5 10-6.5s8 2.5 10 6.5"
        stroke="rgb(var(--color-orange))"
        strokeWidth="3"
        strokeLinecap="round"
        opacity={0.9}
      />
    </svg>
  );
}
