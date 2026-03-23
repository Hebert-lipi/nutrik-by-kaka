"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonClassName } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";
import { cn } from "@/lib/utils";

const MATERIALS_CATALOG = [
  { id: "meal-prep-basico", title: "Guia de meal prep da semana", type: "PDF", goal: "Rotina" },
  { id: "hidratação-clinica", title: "Checklist de hidratação", type: "PDF", goal: "Adesão" },
  { id: "lista-substituicoes", title: "Tabela prática de substituições", type: "PDF", goal: "Flexibilidade" },
  { id: "proteinas-porcoes", title: "Proteínas e porções visuais", type: "Imagem", goal: "Composição corporal" },
];

export default function PatientMateriaisPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = typeof params.patientId === "string" ? params.patientId : "";
  const { patients, loading } = useSupabasePatients();
  const patient = patients.find((p) => p.id === patientId);
  const [mode, setMode] = React.useState<"all" | "curated">("curated");
  const [assigned, setAssigned] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!patientId || typeof window === "undefined") return;
    const key = `nutrik:materials:${patientId}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      setAssigned([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as string[];
      setAssigned(Array.isArray(parsed) ? parsed : []);
    } catch {
      setAssigned([]);
    }
  }, [patientId]);

  function persist(next: string[]) {
    setAssigned(next);
    if (typeof window !== "undefined" && patientId) {
      window.localStorage.setItem(`nutrik:materials:${patientId}`, JSON.stringify(next));
    }
  }

  function toggleAssign(id: string) {
    if (assigned.includes(id)) persist(assigned.filter((x) => x !== id));
    else persist([...assigned, id]);
  }

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
          onClick={() => setMode("all")}
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
            <p className="mt-1 text-small12 text-text-secondary">Catálogo geral da clínica</p>
          </CardHeader>
          <CardContent className="space-y-2 py-4">
            {(mode === "all" ? MATERIALS_CATALOG : MATERIALS_CATALOG.filter((m) => assigned.includes(m.id))).map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200/70 bg-neutral-50/40 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{m.title}</p>
                  <p className="text-[11px] text-text-muted">{m.type} · {m.goal}</p>
                </div>
                <button
                  type="button"
                  className={buttonClassName(assigned.includes(m.id) ? "outline" : "secondary", "sm", "rounded-lg")}
                  onClick={() => toggleAssign(m.id)}
                >
                  {assigned.includes(m.id) ? "Remover" : "Liberar"}
                </button>
              </div>
            ))}
            {mode === "curated" && assigned.length === 0 ? (
              <p className="py-6 text-center text-small12 font-semibold text-text-muted">Nenhum material liberado ainda.</p>
            ) : null}
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
          <CardContent className="py-4">
            {assigned.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-body14 font-semibold text-text-muted">Nenhum material liberado</p>
                <p className="mx-auto mt-2 max-w-xs text-small12 text-text-muted">Selecione materiais no catálogo à esquerda.</p>
                <button
                  type="button"
                  className={buttonClassName("outline", "sm", "mt-4 rounded-xl font-bold")}
                  onClick={() => setMode("all")}
                >
                  Ver catálogo
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {MATERIALS_CATALOG.filter((m) => assigned.includes(m.id)).map((m) => (
                  <div key={`assigned-${m.id}`} className="rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-2">
                    <p className="text-sm font-semibold text-text-primary">{m.title}</p>
                    <p className="text-[11px] text-text-secondary">{m.type} · {m.goal}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
