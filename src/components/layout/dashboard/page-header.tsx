import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  className,
  eyebrow,
}: {
  title: string;
  description?: string;
  /** Rótulo curto acima do título (opcional). */
  eyebrow?: string;
  className?: string;
}) {
  return (
    <header className={cn("border-b border-neutral-200/60 pb-5", className)}>
      {eyebrow ? (
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">{eyebrow}</p>
      ) : null}
      <h2
        className={cn(
          "font-semibold tracking-tight text-text-primary",
          eyebrow ? "mt-1.5" : "",
          "text-xl leading-snug md:text-[1.375rem] md:leading-tight",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-body14 leading-relaxed text-text-secondary">{description}</p>
      ) : null}
    </header>
  );
}
