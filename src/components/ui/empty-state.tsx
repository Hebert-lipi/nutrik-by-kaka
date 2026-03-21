import * as React from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { IconEmptyIllustration } from "./icons-stat";

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
  /** Oculta ilustração quando o espaço é muito compacto */
  hideIllustration?: boolean;
};

export function EmptyState({ title, description, action, className, hideIllustration }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200/50 bg-gradient-to-b from-bg-0 via-bg-0 to-neutral-50/30 px-6 py-12 text-center shadow-sm",
        className,
      )}
    >
      <div className="mx-auto max-w-md">
        {hideIllustration ? null : (
          <div className="mb-6">
            <IconEmptyIllustration />
          </div>
        )}
        <h2 className="text-[1.125rem] font-extrabold tracking-tight text-text-primary md:text-title18">{title}</h2>
        {description ? (
          <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-text-secondary">{description}</p>
        ) : null}
        {action ? (
          <div className="mt-8 flex justify-center">
            <Button onClick={action.onClick} className="min-w-[220px] rounded-xl px-8 py-3 text-sm font-bold">
              {action.label}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
