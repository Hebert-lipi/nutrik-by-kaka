"use client";

/** Folha + wordmark no estilo do mock (verde escuro). */
export function NutrikLogoMark({ className }: { className?: string }) {
  return (
    <div className={className ?? "flex items-center justify-center gap-2.5"}>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/12 text-secondary ring-1 ring-secondary/20" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-secondary">
          <path
            d="M12 3C8.5 6 6 9.5 6 14c0 3.5 2 6 6 6s6-2.5 6-6c0-4.5-2.5-8-6-11z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M12 8v10M9 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
        </svg>
      </span>
      <span className="text-lg font-extrabold tracking-tight text-secondary sm:text-xl">Nutrik by Kaká</span>
    </div>
  );
}
