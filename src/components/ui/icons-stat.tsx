import * as React from "react";
import { cn } from "@/lib/utils";

function Svg({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className={cn(className)} aria-hidden>
      {children}
    </svg>
  );
}

export function IconStatPeople({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path
        d="M11 10.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM4.75 17.25v-.75a3.75 3.75 0 0 1 3.75-3.75h5a3.75 3.75 0 0 1 3.75 3.75v.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconStatLayers({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path
        d="M3 8.5 11 4l8 4.5-8 4.5-8-4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m3 12.5 8 4.5 8-4.5M3 16.5l8 4.5 8-4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconStatCheck({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path
        d="M11 19.25a8.25 8.25 0 1 0 0-16.5 8.25 8.25 0 0 0 0 16.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m7.25 11.25 2.75 2.75L15.25 8.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className={cn(className)}
      aria-hidden
    >
      <path
        d="M7 5.5 11.5 9 7 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconEmptyIllustration({ className }: { className?: string }) {
  return (
    <svg
      width="120"
      height="72"
      viewBox="0 0 120 72"
      fill="none"
      className={cn("mx-auto", className)}
      aria-hidden
    >
      <rect x="8" y="12" width="104" height="48" rx="16" fill="#c5e063" fillOpacity="0.08" stroke="#c5e063" strokeOpacity="0.22" strokeWidth="1" />
      <circle cx="40" cy="36" r="12" fill="#c5e063" fillOpacity="0.14" />
      <rect x="60" y="28" width="40" height="6" rx="3" fill="#e5e7eb" />
      <rect x="60" y="38" width="28" height="6" rx="3" fill="#f3f4f6" />
    </svg>
  );
}
