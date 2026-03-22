"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Chip } from "@/components/ui/chip";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";
import { useSupabaseDietPlans } from "@/hooks/use-supabase-diet-plans";
import { patientDietSummary } from "@/lib/clinical/dashboard-snapshot";
import { fetchAdherenceLogsForPatient, type AdherenceLogRow } from "@/lib/supabase/patient-adherence-db";
import { formatPatientDateTime } from "@/lib/patients/patient-display";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TimelineEvent = {
  id: string;
  at: string;
  title: string;
  detail: string;
  kind: "plan" | "note" | "adherence" | "patient";
};

export default function PatientHistoricoPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = typeof params.patientId === "string" ? params.patientId : "";
  const { patients, loading: lp } = useSupabasePatients();
  const { plans, loading: lpl } = useSupabaseDietPlans();
  const patient = patients.find((p) => p.id === patientId);
  const summary = patient ? patientDietSummary(patient, plans) : null;
  const [adherenceLogs, setAdherenceLogs] = React.useState<AdherenceLogRow[]>([]);

  React.useEffect(() => {
    if (!patient?.id) return;
    let c = false;
    void fetchAdherenceLogsForPatient(patient.id, 100).then((rows) => {
      if (!c) setAdherenceLogs(rows);
    });
    return () => {
      c = true;
    };
  }, [patient?.id]);

  const events: TimelineEvent[] = React.useMemo(() => {
    const list: TimelineEvent[] = [];
    if (patient?.createdAt) {
      list.push({
        id: "created",
        at: patient.createdAt,
        title: "Paciente cadastrado",
        detail: "Entrada no diretório clínico",
        kind: "patient",
      });
    }
    const revs = summary?.publishedPlan?.revisionHistory ?? [];
    for (const r of [...revs].reverse()) {
      list.push({
        id: `rev-${r.id}`,
        at: r.savedAt,
        title: r.status === "published" ? "Plano publicado / revisão" : "Rascunho salvo",
        detail: `${r.name} · v${r.versionNumber}${r.changedByLabel ? ` · ${r.changedByLabel}` : ""}`,
        kind: "plan",
      });
    }
    if (patient?.clinicalNotes?.trim()) {
      list.push({
        id: "notes",
        at: patient.updatedAt ?? patient.createdAt ?? new Date().toISOString(),
        title: "Observações clínicas (ficha)",
        detail: "Atualização nas notas internas da nutricionista",
        kind: "note",
      });
    }
    for (const log of adherenceLogs.slice(0, 25)) {
      list.push({
        id: `adh-${log.id}`,
        at: log.updated_at,
        title: log.scope === "daily" ? "Registro do dia" : "Marcação de refeição",
        detail:
          log.scope === "meal"
            ? `${log.completed ? "Realizada" : "Pendente"} · ${log.difficulty} · ${log.log_date}`
            : `${log.log_date} · ${log.notes?.slice(0, 80) || "—"}`,
        kind: "adherence",
      });
    }
    return list.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [patient, summary, adherenceLogs]);

  if (!patientId) {
    return <EmptyState title="ID inválido" action={{ label: "Voltar", onClick: () => router.push("/patients") }} />;
  }
  if (lp || lpl) {
    return <div className="flex min-h-[40vh] items-center justify-center font-semibold text-text-muted">Carregando…</div>;
  }
  if (!patient) {
    return <EmptyState title="Paciente não encontrado" action={{ label: "Voltar", onClick: () => router.push("/patients") }} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">Histórico</p>
        <h2 className="mt-1 text-title16 font-semibold text-text-primary md:text-h4">Linha do tempo e auditoria</h2>
        <p className="mt-2 max-w-2xl text-small12 font-semibold text-text-secondary">
          Base para versionamento de planos e rastreabilidade clínica. Eventos mesclados de plano, ficha e portal do paciente.
        </p>
      </div>

      <Card className="border-neutral-200/55 shadow-premium-sm">
        <CardHeader className="border-b border-neutral-100/90 pb-4">
          <p className="text-title16 font-semibold text-text-primary">Eventos</p>
          <p className="mt-1 text-small12 text-text-secondary">Ordenados do mais recente ao mais antigo</p>
        </CardHeader>
        <CardContent className="p-0">
          {events.length === 0 ? (
            <div className="px-5 py-14 text-center text-body14 font-semibold text-text-muted">Nenhum evento para exibir ainda.</div>
          ) : (
            <ul className="divide-y divide-neutral-100/90">
              {events.map((ev, i) => (
                <li key={ev.id} className="relative flex gap-4 px-4 py-4 md:px-6">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "z-[1] h-3 w-3 shrink-0 rounded-full ring-4 ring-bg-0",
                        ev.kind === "plan" && "bg-primary",
                        ev.kind === "patient" && "bg-secondary",
                        ev.kind === "note" && "bg-yellow/80",
                        ev.kind === "adherence" && "bg-neutral-400",
                      )}
                    />
                    {i < events.length - 1 ? (
                      <span className="mt-0.5 w-px flex-1 min-h-[1.5rem] bg-gradient-to-b from-neutral-200 to-transparent" aria-hidden />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary">{ev.title}</p>
                      <Chip tone="muted" className="text-[10px]">
                        {ev.kind === "plan" ? "Plano" : ev.kind === "patient" ? "Cadastro" : ev.kind === "note" ? "Ficha" : "Portal"}
                      </Chip>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-text-secondary">{ev.detail}</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-text-muted">
                      {formatPatientDateTime(ev.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Link href={`/patients/${patientId}/plano`} className={buttonClassName("outline", "md", "inline-flex rounded-xl")}>
        Gerir planos
      </Link>
    </div>
  );
}
