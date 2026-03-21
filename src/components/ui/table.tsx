import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn("w-full border-collapse text-left text-sm", className)} {...props} />
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
        "border-b border-neutral-200/90 bg-gradient-to-b from-neutral-50 to-neutral-50/40 px-4 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-text-muted",
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
        "border-b border-neutral-100/95 px-4 py-4 text-body14 text-text-primary transition-colors",
        className,
      )}
      {...props}
    />
  );
}
