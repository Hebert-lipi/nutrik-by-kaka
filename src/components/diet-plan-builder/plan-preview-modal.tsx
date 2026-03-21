"use client";

import * as React from "react";
import type { DraftPlan, DraftPatient } from "@/lib/draft-storage";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { PlanPreviewContent } from "./plan-preview-content";

export function PlanPreviewModal({
  open,
  onClose,
  plan,
  patients,
}: {
  open: boolean;
  onClose: () => void;
  plan: DraftPlan;
  patients: DraftPatient[];
}) {
  const patientDisplayName = React.useMemo(() => {
    const label = plan.patientHeaderLabel.trim();
    if (label) return label;
    if (plan.linkedPatientId) {
      const p = patients.find((x) => x.id === plan.linkedPatientId);
      if (p) return p.name;
    }
    return "";
  }, [plan.patientHeaderLabel, plan.linkedPatientId, patients]);

  const handlePrint = React.useCallback(() => {
    document.body.setAttribute("data-nutrik-printing-plan", "true");
    window.requestAnimationFrame(() => {
      window.print();
      window.setTimeout(() => document.body.removeAttribute("data-nutrik-printing-plan"), 500);
    });
  }, []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="planPreview"
      title="Pré-visualização do plano"
      description="Layout alinhado a documento clínico e futura exportação em PDF. Inclui alterações ainda não salvas."
      className="max-w-3xl max-h-[min(92vh,880px)]"
      footer={
        <div className="nutrik-print-hide flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Fechar
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={handlePrint}>
            Imprimir / PDF
          </Button>
        </div>
      }
    >
      <div className="max-h-[min(60vh,520px)] overflow-y-auto pr-1 md:max-h-[min(65vh,560px)] print:max-h-none">
        <PlanPreviewContent plan={plan} patientDisplayName={patientDisplayName} />
      </div>
      <p className="nutrik-print-hide mt-4 text-[11px] font-semibold text-text-muted">
        Dica: em Imprimir, escolha “Salvar como PDF” no destino.
      </p>
    </Modal>
  );
}
