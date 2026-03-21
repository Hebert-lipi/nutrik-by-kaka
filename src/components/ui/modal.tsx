"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /** Usado para esconder título do modal na impressão (ex.: pré-visualização de plano). */
  variant?: "default" | "planPreview";
};

export function Modal({ open, onClose, title, description, children, footer, className, variant = "default" }: ModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="nutrik-modal-overlay fixed inset-0 z-[100] flex items-end justify-center bg-neutral-900/40 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nutrik-modal-title"
        className={cn(
          "max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-3xl border border-neutral-200/70 bg-bg-0 shadow-[0_24px_64px_-12px_rgba(15,23,42,0.16)]",
          variant === "planPreview" && "nutrik-plan-preview-dialog",
          className,
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-neutral-100 px-6 py-5">
          <h2 id="nutrik-modal-title" className="text-title18 font-extrabold text-text-primary">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 text-body14 leading-relaxed text-text-secondary">{description}</p>
          ) : null}
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-neutral-100 px-6 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
