import * as React from "react";
import { cn } from "@/lib/utils";

type PillTone = "primary" | "secondary" | "yellow" | "orange" | "neutral";

export type PillProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: PillTone;
};

const toneStyles: Record<PillTone, string> = {
  primary: "bg-primary/15 text-primary border border-primary/25",
  secondary: "bg-secondary/15 text-secondary border border-secondary/25",
  yellow: "bg-yellow/20 text-yellow border border-yellow/25",
  orange: "bg-orange/20 text-orange border border-orange/25",
  neutral: "bg-neutral-100 text-text-secondary border border-neutral-200",
};

export function Pill({ className, tone = "neutral", ...props }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold leading-none",
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}

