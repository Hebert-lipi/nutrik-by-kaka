"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => ReactElement;
  /** Ação principal: formato “squircle”, elevado (referência app). */
  prominent?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/avaliacoes", label: "Avaliações", icon: ClipboardIcon },
  { href: "/receitas", label: "Receitas", icon: BowlIcon },
  { href: "/meu-plano", label: "Plano", icon: HeartbeatIcon, prominent: true },
  { href: "/lista-compras", label: "Compras", icon: ListIcon },
  { href: "/materiais", label: "Materiais", icon: MaterialsIcon },
];

export function PatientBottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal do paciente"
      className="fixed inset-x-0 bottom-0 z-40 overflow-visible border-t border-neutral-200/80 bg-white shadow-[0_-1px_0_rgba(15,23,42,0.04)] supports-[padding:max(0px)]:pb-[max(0.25rem,env(safe-area-inset-bottom))]"
    >
      {/*
        Modelo: faixa branca fina; squircle com centro ~na borda superior da faixa (metade dentro / metade fora),
        sem “coluna” alta de padding que engrosa toda a barra.
      */}
      <ul className="mx-auto grid max-w-md grid-cols-5 items-end gap-0 overflow-visible px-1.5 pb-1 pt-0 md:max-w-4xl md:gap-0.5 md:px-6 md:pb-1.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const isProminent = Boolean(item.prominent);

          return (
            <li key={item.href} className="relative flex min-w-0 justify-center overflow-visible">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex min-w-0 max-w-[5.75rem] touch-manipulation flex-col items-center justify-end gap-0.5 pb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                )}
              >
                <span
                  className={cn(
                    "relative z-10 flex shrink-0 items-center justify-center transition-[transform,box-shadow] duration-200 ease-out",
                    isProminent
                      ? cn(
                          /* Sobe mais que 50% para afastar o squircle do rótulo “Plano”; mb negativo alinha o bloco no flex. */
                          "mb-[-1.625rem] h-12 w-12 -translate-y-[62%] rounded-[1.05rem] bg-secondary text-white shadow-[0_12px_28px_-10px_rgba(34,110,72,0.58),0_6px_14px_-8px_rgba(15,23,42,0.14)] ring-[1.5px] ring-white md:mb-[-1.7rem] md:h-[3.15rem] md:w-[3.15rem] md:-translate-y-[62%] md:rounded-[1.15rem]",
                        )
                      : cn(
                          "h-8 w-8 rounded-full",
                          active
                            ? "bg-secondary/[0.14] text-secondary"
                            : "bg-transparent text-neutral-500 group-hover:text-neutral-600",
                        ),
                  )}
                >
                  <Icon
                    className={cn(
                      "shrink-0",
                      isProminent ? "h-6 w-6 md:h-[1.65rem] md:w-[1.65rem]" : "h-[1.2rem] w-[1.2rem]",
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "relative z-0 max-w-full truncate px-0.5 text-center text-[9px] font-semibold leading-none md:text-[10px]",
                    isProminent && "mt-1.5 font-bold text-secondary md:mt-2",
                    !isProminent && active && "font-bold text-secondary",
                    !isProminent && !active && "font-medium text-neutral-500 group-hover:text-neutral-600",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HeartbeatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M3 12h3.4l2.1-4.5 3 10 2.2-5.5H21"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M9 4.5h6M8.5 6H7a2 2 0 0 0-2 2v9.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="8.25" y="3" width="7.5" height="3.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function BowlIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 11h16a8 8 0 0 1-16 0Zm4 4.5h8"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M8 7h11M8 12h11M8 17h11" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
      <circle cx="4.5" cy="7" r="1" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" />
      <circle cx="4.5" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

/** Documento / materiais — traço fino alinhado ao modelo. */
function MaterialsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M9 3.5h6l.5 2.5H17a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1.5L9 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 12h6M9 15.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
