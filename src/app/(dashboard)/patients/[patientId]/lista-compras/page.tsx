"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonClassName } from "@/components/ui/button";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";

export default function PatientListaComprasPage() {
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
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">Lista de compras</p>
        <h2 className="mt-1 text-title16 font-semibold text-text-primary md:text-h4">Organização de compras</h2>
        <p className="mt-2 max-w-2xl text-small12 font-semibold text-text-secondary">
          A lista poderá ser gerada a partir do <span className="font-semibold text-text-primary">plano alimentar ativo</span> deste paciente,
          consolidando ingredientes por refeição ou período.
        </p>
      </div>

      <Card className="overflow-hidden border-neutral-200/50 bg-gradient-to-br from-neutral-50/90 via-bg-0 to-primary/[0.05] shadow-premium ring-1 ring-black/[0.04]">
        <CardContent className="flex flex-col items-center px-6 py-16 text-center md:py-20">
          <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-primary/12 text-2xl shadow-inner ring-1 ring-primary/20" aria-hidden>
            🛒
          </div>
          <p className="mt-6 text-title16 font-semibold text-text-primary">Nenhuma lista gerada</p>
          <p className="mx-auto mt-3 max-w-lg text-body14 font-medium leading-relaxed text-text-secondary">
            Quando ativarmos o motor de geração, os itens virão do plano publicado (e futuramente das receitas), respeitando substituições e porções.
          </p>
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="mt-8 h-12 rounded-full px-10 font-semibold shadow-premium-sm"
            onClick={() =>
              alert(
                "Em breve: analisar plano ativo e montar lista agrupada (hortifruti, proteínas, despensa). Por enquanto, revise o plano na aba Plano alimentar.",
              )
            }
          >
            Gerar lista de compras
          </Button>
          <button
            type="button"
            className={buttonClassName("ghost", "sm", "mt-4 font-bold text-text-muted")}
            onClick={() => router.push(`/patients/${patientId}/plano`)}
          >
            Abrir plano alimentar
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
