import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={cn("space-y-2 pb-2", className)}>
      <h2 className="text-h3 font-extrabold tracking-tight text-text-primary">{title}</h2>
      {description ? (
        <p className="max-w-2xl text-body14 leading-relaxed text-text-secondary">{description}</p>
      ) : null}
    </header>
  );
}
