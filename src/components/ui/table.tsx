import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn("w-full border-collapse text-left text-body14", className)} {...props} />
  );
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "group/row transition-colors duration-150 hover:bg-gradient-to-r hover:from-primary/[0.04] hover:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "border-b border-neutral-200/90 bg-neutral-50/80 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "border-b border-neutral-100/95 px-3 py-2.5 text-body14 text-text-primary transition-colors",
        className,
      )}
      {...props}
    />
  );
}
