import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[rgb(var(--color-ring))] focus-visible:ring-offset-bg-1 disabled:opacity-55 disabled:pointer-events-none";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-lift hover:brightness-[0.97] active:scale-[0.99]",
  secondary: "bg-secondary text-secondary-foreground shadow-lift hover:opacity-95",
  ghost: "bg-transparent text-text-secondary hover:bg-neutral-100/80",
  outline: "border border-neutral-200/90 bg-bg-0 text-text-secondary shadow-sm hover:bg-neutral-50",
  danger: "bg-orange text-white shadow-lift hover:brightness-95 active:scale-[0.99]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return <button className={cn(base, variantStyles[variant], sizeStyles[size], className)} {...props} />;
}

