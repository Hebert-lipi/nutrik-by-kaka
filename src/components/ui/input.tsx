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
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="block text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted"
        >
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-9 w-full rounded-md border bg-bg-0 px-3 text-body14 text-text-primary shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-neutral-400 focus-visible:outline-none",
          error
            ? "border-orange/55 ring-2 ring-orange/20 focus:border-orange/50 focus:ring-orange/25"
            : "border-neutral-200/90 focus:border-primary/30 focus:ring-2 focus:ring-primary/12",
        )}
        {...props}
      />
      {error ? <p className="text-small12 text-orange">{error}</p> : null}
    </div>
  );
});

