import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Evita `pointer-events-none` em `disabled` (útil com tranca em ref no `onClick`). */
  allowPointerEventsWhenDisabled?: boolean;
};

export const buttonBaseClass =
  "inline-flex items-center justify-center gap-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[rgb(var(--color-ring))] focus-visible:ring-offset-bg-1 disabled:opacity-50 disabled:pointer-events-none";

const base = buttonBaseClass;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "rounded-md bg-gradient-to-b from-primary to-[rgb(175_205_85)] text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.28)_inset,0_4px_12px_-4px_rgba(130,150,50,0.4)] ring-1 ring-black/[0.04] hover:brightness-[1.02] active:brightness-[0.98]",
  secondary:
    "rounded-md bg-secondary text-secondary-foreground shadow-[0_1px_2px_rgba(34,110,72,0.12)] ring-1 ring-black/[0.04] hover:opacity-95",
  ghost: "rounded-md bg-transparent text-text-secondary hover:bg-neutral-100/90",
  outline:
    "rounded-md border border-neutral-200/95 bg-bg-0/90 text-text-secondary shadow-sm hover:border-neutral-300 hover:bg-neutral-50/90",
  danger:
    "rounded-md bg-gradient-to-b from-orange to-orange/90 text-white shadow-[0_4px_14px_-4px_rgba(255,120,60,0.35)] ring-1 ring-black/[0.04] hover:brightness-[1.02] active:brightness-[0.98]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 min-h-[2rem] px-3 text-xs",
  md: "h-9 min-h-[2.25rem] px-3.5",
  lg: "h-10 min-h-[2.5rem] px-4 text-sm",
};

/** Para `<Link>` com a mesma hierarquia visual dos botões. */
export function buttonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(base, variantStyles[variant], sizeStyles[size], className);
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  allowPointerEventsWhenDisabled,
  ...props
}: ButtonProps) {
  const baseClass = allowPointerEventsWhenDisabled
    ? buttonBaseClass.replace(" disabled:pointer-events-none", " disabled:pointer-events-auto")
    : base;
  return <button className={cn(baseClass, variantStyles[variant], sizeStyles[size], className)} {...props} />;
}
