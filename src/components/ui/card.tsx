import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-200/60 bg-bg-0 shadow-premium-sm ring-1 ring-black/[0.03]",
        "transition-[box-shadow,border-color] duration-200 hover:shadow-premium hover:ring-black/[0.05]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 pt-4 md:px-5 md:pt-5", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 pb-4 md:px-5 md:pb-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-title18 font-semibold tracking-tight text-text-primary", className)} {...props} />;
}
