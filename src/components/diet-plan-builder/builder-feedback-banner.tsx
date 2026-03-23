"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type BuilderFeedback =
  | { tone: "success"; title: string; body?: string }
  | { tone: "error"; title: string; body?: string };

export function BuilderFeedbackBanner({
  feedback,
  onDismiss,
}: {
  feedback: BuilderFeedback | null;
  onDismiss: () => void;
}) {
  React.useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(onDismiss, 6500);
    return () => window.clearTimeout(t);
  }, [feedback, onDismiss]);

  if (!feedback) return null;

  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-24 left-1/2 z-[60] w-[min(100%,22rem)] -translate-x-1/2 px-3 md:bottom-8 md:left-auto md:right-6 md:translate-x-0 md:w-[min(100%,24rem)]",
      )}
    >
      <div
        className={cn(
          "rounded-2xl border px-4 py-3.5 shadow-premium backdrop-blur-md",
          feedback.tone === "success"
            ? "border-secondary/30 bg-bg-0/98 ring-1 ring-secondary/10"
            : "border-orange/35 bg-orange/[0.12] ring-1 ring-orange/15",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-small12 font-bold text-text-primary">{feedback.title}</p>
            {feedback.body ? (
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-text-secondary">{feedback.body}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold text-text-muted hover:bg-neutral-100/90"
            aria-label="Fechar aviso"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
