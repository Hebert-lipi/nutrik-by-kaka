import * as React from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-neutral-200 bg-gradient-to-b from-neutral-50/80 to-bg-0 px-6 py-10 text-center shadow-sm",
        className,
      )}
    >
      <div className="mx-auto max-w-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
          <span className="text-lg font-bold text-primary" aria-hidden>
            +
          </span>
        </div>
        <h2 className="text-title18 font-extrabold text-text-primary">{title}</h2>
        {description ? (
          <p className="mt-2 text-body14 leading-relaxed text-text-secondary">{description}</p>
        ) : null}
        {action ? (
          <div className="mt-6 flex justify-center">
            <Button onClick={action.onClick} className="min-w-[200px] rounded-lg px-6">
              {action.label}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

