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
        "rounded-lg border border-neutral-200 bg-bg-0 p-6 text-center shadow-soft",
        className,
      )}
    >
      <div className="mx-auto max-w-md">
        <h2 className="text-h4 text-text-primary">{title}</h2>
        {description ? <p className="mt-2 text-body14 text-text-secondary">{description}</p> : null}
        {action ? (
          <div className="mt-5 flex justify-center">
            <Button onClick={action.onClick}>{action.label}</Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

