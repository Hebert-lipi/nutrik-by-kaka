"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card branco flutuante (próximo ao mock Figma): sombra suave, cantos bem arredondados.
 * Formulário fica aqui dentro; marca e título ficam FORA (página).
 */
export function LoginGlassPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border border-white/80 bg-white/[0.94] p-7 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.8)_inset] backdrop-blur-md sm:p-8",
        "transition-shadow duration-300 hover:shadow-[0_28px_70px_-18px_rgba(15,23,42,0.22)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
