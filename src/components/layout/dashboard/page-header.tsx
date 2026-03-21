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
    <header className={cn("border-b border-neutral-200/60 pb-8", className)}>
      {eyebrow ? (
        <p className="text-small12 font-bold uppercase tracking-[0.12em] text-text-muted">{eyebrow}</p>
      ) : null}
      <h2
        className={cn(
          "font-extrabold tracking-tight text-text-primary",
          eyebrow ? "mt-2" : "",
          "text-[1.625rem] leading-tight md:text-[1.75rem] md:leading-snug",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-text-secondary/95">{description}</p>
      ) : null}
    </header>
  );
}
