"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonClassName } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";
import { cn } from "@/lib/utils";

export default function PatientMateriaisPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = typeof params.patientId === "string" ? params.patientId : "";
  const { patients, loading } = useSupabasePatients();
  const patient = patients.find((p) => p.id === patientId);
  const [mode, setMode] = React.useState<"all" | "curated">("curated");

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">Materiais</p>
          <h2 className="mt-1 text-title16 font-semibold text-text-primary md:text-h4">Conteúdo educativo</h2>
          <p className="mt-2 max-w-2xl text-small12 font-semibold text-text-secondary">
            Materiais globais da clínica vs. seleção entregue a este paciente — visual preparado para as duas lógicas.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          className="h-11 rounded-full px-6 font-semibold"
          onClick={() => alert("Configuração de materiais — em breve: picker de PDFs/vídeos e políticas de acesso.")}
        >
          Configurar materiais
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-neutral-200/70 bg-bg-0 p-2 shadow-inner">
        <button
          type="button"
          onClick={() => setMode("curated")}
          className={cn(
            "rounded-xl px-4 py-2 text-small12 font-semibold transition-all",
            mode === "curated" ? "bg-text-primary text-bg-0 shadow-sm" : "text-text-secondary hover:bg-neutral-50",
          )}
        >
          Só liberados ao paciente
        </button>
        <button
          type="button"
          onClick={() => setMode("all")}
          className={cn(
            "rounded-xl px-4 py-2 text-small12 font-semibold transition-all",
            mode === "all" ? "bg-text-primary text-bg-0 shadow-sm" : "text-text-secondary hover:bg-neutral-50",
          )}
        >
          Todos os materiais (clínica)
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-neutral-200/55 shadow-premium-sm">
          <CardHeader className="border-b border-neutral-100/90 pb-3">
            <div className="flex items-center gap-2">
              <p className="text-title16 font-semibold text-text-primary">Materiais disponíveis</p>
              <Chip tone="muted">Biblioteca</Chip>
            </div>
            <p className="mt-1 text-small12 text-text-secondary">Catálogo geral (placeholder)</p>
          </CardHeader>
          <CardContent className="py-10 text-center text-small12 font-semibold text-text-muted">
            {mode === "all" ? "Em breve: grade com busca e filtros." : "Alterne para “Todos” para simular o catálogo completo."}
          </CardContent>
        </Card>
        <Card className="border-primary/15 shadow-premium-sm ring-1 ring-primary/10">
          <CardHeader className="border-b border-neutral-100/90 pb-3">
            <div className="flex items-center gap-2">
              <p className="text-title16 font-semibold text-text-primary">Liberados para {patient.name.split(" ")[0]}</p>
              <Chip tone="primary">Paciente</Chip>
            </div>
            <p className="mt-1 text-small12 text-text-secondary">Somente o que você autorizar</p>
          </CardHeader>
          <CardContent className="py-10 text-center">
            <p className="text-body14 font-semibold text-text-muted">Nenhum material liberado</p>
            <p className="mx-auto mt-2 max-w-xs text-small12 text-text-muted">Use “Configurar materiais” quando o backend estiver pronto.</p>
            <button
              type="button"
              className={buttonClassName("outline", "sm", "mt-4 rounded-xl font-bold")}
              onClick={() => setMode("all")}
            >
              Ver catálogo (preview)
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
