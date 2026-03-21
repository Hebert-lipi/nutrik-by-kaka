import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const buttonBaseClass =
  "inline-flex items-center justify-center gap-2 font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[rgb(var(--color-ring))] focus-visible:ring-offset-bg-1 disabled:opacity-50 disabled:pointer-events-none";

const base = buttonBaseClass;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "rounded-full bg-gradient-to-b from-primary to-[rgb(175_205_85)] text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_10px_28px_-6px_rgba(130,150,50,0.55)] ring-1 ring-black/5 hover:brightness-[1.03] active:scale-[0.98] active:brightness-[0.98]",
  secondary:
    "rounded-full bg-secondary text-secondary-foreground shadow-[0_2px_10px_-2px_rgba(34,110,72,0.35)] ring-1 ring-black/5 hover:opacity-95 active:scale-[0.99]",
  ghost: "rounded-xl bg-transparent text-text-secondary hover:bg-neutral-100/90",
  outline:
    "rounded-full border-2 border-neutral-200/95 bg-bg-0/80 text-text-secondary shadow-sm hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.99]",
  danger:
    "rounded-full bg-gradient-to-b from-orange to-orange/90 text-white shadow-[0_8px_24px_-6px_rgba(255,120,60,0.45)] ring-1 ring-black/5 hover:brightness-105 active:scale-[0.98]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs",
  md: "h-11 min-h-[2.75rem] px-5 text-sm",
  lg: "h-12 min-h-[3rem] px-7 text-sm md:text-base",
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
  ...props
}: ButtonProps) {
  return <button className={cn(base, variantStyles[variant], sizeStyles[size], className)} {...props} />;
}
