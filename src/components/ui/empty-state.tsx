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
        "rounded-lg border border-neutral-200/50 bg-gradient-to-b from-bg-0 via-bg-0 to-neutral-50/30 px-4 py-8 text-center shadow-sm",
        className,
      )}
    >
      <div className="mx-auto max-w-md">
        {hideIllustration ? null : (
          <div className="mb-4 [&_svg]:max-h-[100px] [&_svg]:w-auto">
            <IconEmptyIllustration />
          </div>
        )}
        <h2 className="text-title16 font-semibold tracking-tight text-text-primary">{title}</h2>
        {description ? (
          <p className="mt-2 text-body14 leading-relaxed text-text-secondary">{description}</p>
        ) : null}
        {action ? (
          <div className="mt-5 flex justify-center">
            <Button onClick={action.onClick} className="min-w-[180px]">
              {action.label}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
