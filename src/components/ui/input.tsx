import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, id, ...props },
  ref,
) {
  const inputId = id ?? (label ? `field-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <label htmlFor={inputId} className="block text-body14 font-semibold text-text-secondary">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        ref={ref}
        className="h-11 w-full rounded-lg border border-neutral-200 bg-bg-0 px-4 text-sm text-text-primary placeholder:text-neutral-400 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-ring))]"
        {...props}
      />
      {error ? <p className="text-small12 text-orange">{error}</p> : null}
    </div>
  );
});

