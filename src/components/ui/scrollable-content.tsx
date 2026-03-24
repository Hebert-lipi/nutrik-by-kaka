"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ScrollableContentProps = {
  children: React.ReactNode;
  className?: string;
  maxHeightClassName?: string;
};

/**
 * Wrapper padrão para listas longas dentro de cards.
 * Mantém rolagem interna estável sem crescer indefinidamente a página.
 */
export function ScrollableContent({
  children,
  className,
  maxHeightClassName = "max-h-[560px]",
}: ScrollableContentProps) {
  return (
    <div className={cn(maxHeightClassName, "overflow-y-auto pr-1 [scrollbar-gutter:stable]", className)}>
      {children}
    </div>
  );
}
