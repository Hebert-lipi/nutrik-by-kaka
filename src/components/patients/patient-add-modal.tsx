"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  patientId: string;
};

const rowClass =
  "flex w-full items-center justify-between gap-3 rounded-xl border border-transparent px-4 py-3.5 text-left transition-colors hover:border-primary/15 hover:bg-primary/[0.04]";

export function PatientAddModal({ open, onClose, patientId }: Props) {
  const router = useRouter();

  const go = (fn: () => void) => {
    onClose();
    fn();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adicionar ao paciente"
      description="Escolha o que deseja incluir no prontuário deste paciente. O fluxo fica organizado e a tela principal permanece limpa."
      footer={
        <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <div className="space-y-1">
        <button
          type="button"
          className={rowClass}
          onClick={() => go(() => router.push("/diet-plans/new"))}
        >
          <span>
            <span className="block text-sm font-semibold text-text-primary">Plano alimentar</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-text-muted">Novo plano no construtor (vincule o paciente ao salvar)</span>
          </span>
          <span className="text-text-muted">→</span>
        </button>
        <button
          type="button"
          className={rowClass}
          onClick={() => go(() => router.push(`/patients/${patientId}/perfil#observacoes`))}
        >
          <span>
            <span className="block text-sm font-semibold text-text-primary">Observação clínica</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-text-muted">Abre o perfil na seção de observações</span>
          </span>
          <span className="text-text-muted">→</span>
        </button>
        <button
          type="button"
          className={rowClass}
          onClick={() => go(() => router.push(`/patients/${patientId}/receitas`))}
        >
          <span>
            <span className="block text-sm font-semibold text-text-primary">Receita</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-text-muted">Módulo de receitas do paciente</span>
          </span>
          <span className="text-text-muted">→</span>
        </button>
        <button
          type="button"
          className={rowClass}
          onClick={() => go(() => router.push(`/patients/${patientId}/materiais`))}
        >
          <span>
            <span className="block text-sm font-semibold text-text-primary">Material educativo</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-text-muted">Materiais e handouts</span>
          </span>
          <span className="text-text-muted">→</span>
        </button>
        <button
          type="button"
          className={rowClass}
          onClick={() => go(() => router.push(`/patients/${patientId}/lista-compras`))}
        >
          <span>
            <span className="block text-sm font-semibold text-text-primary">Lista de compras</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-text-muted">Gerar ou revisar lista</span>
          </span>
          <span className="text-text-muted">→</span>
        </button>
        <button
          type="button"
          className={rowClass}
          onClick={() => {
            onClose();
            alert("Metas nutricionais personalizadas — em breve nesta área.");
          }}
        >
          <span>
            <span className="block text-sm font-semibold text-text-primary">Meta (futuro)</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-text-muted">Calorias, macros ou hábitos</span>
          </span>
          <span className="text-text-muted">⋯</span>
        </button>
      </div>
      <div className="mt-4 rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3">
        <Link href="/diet-plans" className="text-small12 font-bold text-primary hover:underline" onClick={onClose}>
          Abrir biblioteca de planos
        </Link>
      </div>
    </Modal>
  );
}
