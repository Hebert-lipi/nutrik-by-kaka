"use client";

/**
 * Login — fundo FULL-BLEED (sem split artificial):
 * - Mobile: /login/bg-mobile.png em toda a tela
 * - Desktop: /login/bg-desktop.png em toda a tela (arte com área livre à esquerda / centro)
 *
 * Overlay leve só para legibilidade — a foto permanece visível (não é coluna sólida).
 */
import * as React from "react";

const V = "3"; // cache bust ao trocar os PNGs em public/login

const BG_DESKTOP = `/login/bg-desktop.png?v=${V}`;
const BG_MOBILE = `/login/bg-mobile.png?v=${V}`;

export function PremiumLoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh min-h-[100svh] w-full overflow-x-hidden bg-[#f7f5f0]">
      {/* Fundo mobile — retrato, conteúdo forte na parte inferior da arte */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-[center_top] bg-no-repeat md:hidden"
        style={{ backgroundImage: `url('${BG_MOBILE}')` }}
        aria-hidden
      />

      {/* Fundo desktop — paisagem; ancora à esquerda para priorizar área “limpa” da arte */}
      <div
        className="pointer-events-none absolute inset-0 z-0 hidden bg-cover bg-no-repeat md:block"
        style={{
          backgroundImage: `url('${BG_DESKTOP}')`,
          backgroundPosition: "left center",
        }}
        aria-hidden
      />

      {/* Véu suave (não borra a imagem como print de dashboard) */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-white/45 via-white/20 to-white/35 md:from-white/40 md:via-white/10 md:to-white/25"
        aria-hidden
      />

      <div className="relative z-10 min-h-dvh min-h-[100svh]">{children}</div>
    </div>
  );
}
