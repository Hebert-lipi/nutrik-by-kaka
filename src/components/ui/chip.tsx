import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-neutral-100 text-text-secondary ring-neutral-200/80",
  primary: "bg-primary/12 text-text-primary ring-primary/20",
  yellow: "bg-yellow/15 text-neutral-800 ring-yellow/25",
  orange: "bg-orange/12 text-neutral-800 ring-orange/20",
  success: "bg-secondary/10 text-secondary ring-secondary/20",
  muted: "bg-neutral-50 text-text-muted ring-neutral-200/60",
} as const;

export type ChipTone = keyof typeof tones;

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: ChipTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ring-1",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
