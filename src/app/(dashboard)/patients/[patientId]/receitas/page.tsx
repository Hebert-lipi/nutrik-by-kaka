"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonClassName } from "@/components/ui/button";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";

export default function PatientReceitasPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = typeof params.patientId === "string" ? params.patientId : "";
  const { patients, loading } = useSupabasePatients();
  const patient = patients.find((p) => p.id === patientId);

  if (!patientId) {
    return <EmptyState title="ID inválido" action={{ label: "Voltar", onClick: () => router.push("/patients") }} />;
  }
  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center font-semibold text-text-muted">Carregando…</div>;
  }
  if (!patient) {
    return <EmptyState title="Paciente não encontrado" action={{ label: "Voltar", onClick: () => router.push("/patients") }} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">Receitas</p>
          <h2 className="mt-1 text-title16 font-semibold text-text-primary md:text-h4">Biblioteca do paciente</h2>
          <p className="mt-2 max-w-2xl text-small12 font-semibold text-text-secondary">
            Separado do plano alimentar. Aqui ficarão fichas técnicas e receitas liberadas só para {patient.name.split(" ")[0]}.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          className="h-11 shrink-0 rounded-full px-6 font-semibold"
          onClick={() => alert("Cadastro de receitas por paciente — conectaremos ao backend na próxima etapa.")}
        >
          Adicionar receita
        </Button>
      </div>

      <Card className="border-dashed border-neutral-300/90 bg-neutral-50/30 shadow-inner">
        <CardHeader className="border-b border-neutral-100/80 pb-4">
          <p className="text-title16 font-semibold text-text-primary">Receitas liberadas</p>
          <p className="mt-1 text-small12 font-semibold text-text-muted">Nenhuma receita vinculada ainda — estrutura pronta para listagem.</p>
        </CardHeader>
        <CardContent className="py-14 text-center">
          <p className="text-body14 font-semibold text-text-muted">Lista vazia</p>
          <p className="mx-auto mt-2 max-w-md text-small12 leading-relaxed text-text-muted">
            Em breve: cards com porções, macros e ações (editar, revogar, duplicar). O plano alimentar continua no módulo próprio.
          </p>
          <button
            type="button"
            className={buttonClassName("outline", "md", "mt-6 inline-flex rounded-xl font-bold")}
            onClick={() => alert("Fluxo de inclusão de receita — em desenvolvimento.")}
          >
            Começar biblioteca
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
