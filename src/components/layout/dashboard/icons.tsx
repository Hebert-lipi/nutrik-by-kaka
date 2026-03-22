import * as React from "react";

function IconBase({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span aria-hidden className={className}>
      {children}
    </span>
  );
}

export function IconDashboard({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M3.5 10.2C3.5 7.2 3.5 5.7 4.5 4.7C5.5 3.7 7 3.7 10 3.7C13 3.7 14.5 3.7 15.5 4.7C16.5 5.7 16.5 7.2 16.5 10.2C16.5 13.2 16.5 14.7 15.5 15.7C14.5 16.7 13 16.7 10 16.7C7 16.7 5.5 16.7 4.5 15.7C3.5 14.7 3.5 13.2 3.5 10.2Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M7.2 11.9V9.4C7.2 8.7 7.7 8.2 8.4 8.2H11.6C12.3 8.2 12.8 8.7 12.8 9.4V11.9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </IconBase>
  );
}

export function IconUsers({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M7.3 9.2C8.4 9.2 9.2 8.4 9.2 7.3C9.2 6.2 8.4 5.4 7.3 5.4C6.2 5.4 5.4 6.2 5.4 7.3C5.4 8.4 6.2 9.2 7.3 9.2Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M12.7 8.8C13.7 8.8 14.5 8 14.5 7C14.5 6 13.7 5.2 12.7 5.2C11.7 5.2 10.9 6 10.9 7C10.9 8 11.7 8.8 12.7 8.8Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M3.8 14.9C4.2 12.4 6 11.3 7.3 11.3C8.7 11.3 10.5 12.4 10.8 14.9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M10.9 14.9C11.1 13.1 12.3 12 13.2 12C14.2 12 15.5 12.8 15.8 14.9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </IconBase>
  );
}

export function IconDietPlan({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M6 3.8H14C15.1 3.8 16 4.7 16 5.8V14.2C16 15.3 15.1 16.2 14 16.2H6C4.9 16.2 4 15.3 4 14.2V5.8C4 4.7 4.9 3.8 6 3.8Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M6.5 7.2H13.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M7.2 11.2H12.8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M7.2 13.4H10.1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </IconBase>
  );
}

/** Porta + seta (logout), alinhado a referências tipo pill “Sair”. */
export function IconLogout({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <path
          d="M7.25 3.5h-2a1.75 1.75 0 0 0-1.75 1.75v7.5a1.75 1.75 0 0 0 1.75 1.75h2"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.25 6.25L14.5 9l-3.25 2.75M6.75 9h7.5"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconBase>
  );
}

export function IconMenu({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 6H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 10H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 14H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </IconBase>
  );
}

export function IconClose({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M5.2 5.2L14.8 14.8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M14.8 5.2L5.2 14.8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </IconBase>
  );
}

export function IconSearch({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="7.5" cy="7.5" r="4.75" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 11l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </IconBase>
  );
}

export function IconBell({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M9 2.5c2.2 0 4 1.6 4 4.2v1.8l.8 2.4H4.2l.8-2.4V6.7c0-2.6 1.8-4.2 4-4.2Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M6.8 13.5h4.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M8 15.2h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </IconBase>
  );
}

