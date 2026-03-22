"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

export function ModulePlaceholder({
  title,
  description,
  eyebrow = "Módulo",
  className,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <Card className={cn("border-neutral-200/55 shadow-premium-sm ring-1 ring-black/[0.03]", className)}>
      <CardHeader className="border-b border-neutral-100/90 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="yellow" className="font-semibold">
            Em construção
          </Chip>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">{eyebrow}</p>
        </div>
        <p className="mt-2 text-title16 font-semibold text-text-primary">{title}</p>
        <p className="mt-1 text-small12 font-semibold leading-relaxed text-text-secondary">{description}</p>
      </CardHeader>
      <CardContent className="py-10 text-center">
        <p className="mx-auto max-w-md text-body14 font-medium text-text-muted">
          A arquitetura deste módulo já está preparada na navegação do paciente. Conteúdo e integrações serão adicionados nas próximas entregas.
        </p>
      </CardContent>
    </Card>
  );
}
