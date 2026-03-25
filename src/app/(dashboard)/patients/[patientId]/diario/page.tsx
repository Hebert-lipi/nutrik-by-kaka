"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Chip } from "@/components/ui/chip";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";
import { fetchAdherenceLogsForPatient, type AdherenceLogRow } from "@/lib/supabase/patient-adherence-db";
import { formatPatientDateTime } from "@/lib/patients/patient-display";
import { ModulePlaceholder } from "@/components/patients/module-placeholder";

export default function PatientDiarioPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = typeof params.patientId === "string" ? params.patientId : "";
  const { patients, loading } = useSupabasePatients();
  const patient = patients.find((p) => p.id === patientId);
  const [logs, setLogs] = React.useState<AdherenceLogRow[]>([]);

  React.useEffect(() => {
    if (!patient?.id) return;
    let c = false;
    void fetchAdherenceLogsForPatient(patient.id, 80).then((rows) => {
      if (!c) setLogs(rows);
    });
    return () => {
      c = true;
    };
  }, [patient?.id]);

  const meals = logs.filter((l) => l.scope === "meal");
  const lastActivity = logs[0]?.updated_at ?? logs[0]?.created_at ?? null;
  const hardDays = meals.filter((m) => m.difficulty === "hard" || m.difficulty === "medium").length;

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
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">Diário</p>
        <h2 className="mt-1 text-title16 font-semibold text-text-primary md:text-h4">Rotina e adesão</h2>
        <p className="mt-2 text-small12 font-semibold text-text-secondary">
          Consolidação do que o paciente registra no portal — preparado para expandir com humor, sintomas e fotos.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Refeições marcadas", value: String(meals.length), hint: "Linhas de log (refeição)" },
          { label: "Com dificuldade", value: String(hardDays), hint: "Médio ou difícil" },
          { label: "Observações (dia)", value: String(logs.filter((l) => l.scope === "daily" && l.notes?.trim()).length), hint: "Notas diárias" },
          { label: "Última atividade", value: lastActivity ? formatPatientDateTime(lastActivity) : "—", hint: "Qualquer registro" },
        ].map((x) => (
          <Card key={x.label} className="border-neutral-200/50 shadow-premium-sm">
            <CardContent className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{x.label}</p>
              <p className="mt-2 text-lg font-semibold text-text-primary">{x.value}</p>
              <p className="mt-1 text-[11px] font-semibold text-text-muted">{x.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ModulePlaceholder
        title="Diário alimentar ampliado"
        description="Registro por dia com contexto clínico, lembretes e correlacionamento com o plano — roadmap Nutrik."
        eyebrow="Evolução"
      />

      <Card className="border-neutral-200/55 shadow-premium-sm">
        <CardHeader className="border-b border-neutral-100/90 pb-4">
          <p className="text-title16 font-semibold text-text-primary">Registros recentes</p>
          <p className="mt-1 text-small12 text-text-secondary">Registos que o paciente faz no portal «Meu plano».</p>
        </CardHeader>
        <CardContent className="pt-5">
          {logs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200/90 bg-neutral-50/40 py-12 text-center">
              <p className="text-body14 font-semibold text-text-muted">Nenhum registro ainda.</p>
              <p className="mt-2 text-small12 text-text-muted">Quando o paciente usar o portal, os itens aparecerão aqui.</p>
            </div>
          ) : (
            <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="rounded-xl border border-neutral-100/90 bg-gradient-to-r from-bg-0 to-neutral-50/30 px-4 py-3 ring-1 ring-black/[0.02]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">{log.log_date}</span>
                    <Chip tone={log.scope === "daily" ? "primary" : "muted"}>{log.scope === "daily" ? "Dia" : "Refeição"}</Chip>
                    {log.scope === "meal" ? (
                      <Chip tone={log.completed ? "success" : "yellow"}>{log.completed ? "Feita" : "Pendente"}</Chip>
                    ) : null}
                  </div>
                  {log.scope === "meal" ? (
                    <p className="mt-2 text-[11px] font-semibold text-text-secondary">Dificuldade: {log.difficulty}</p>
                  ) : (
                    <p className="mt-2 text-[11px] font-medium text-text-secondary">{log.notes?.trim() || "Sem texto"}</p>
                  )}
                  <p className="mt-1 text-[10px] font-semibold text-text-muted">{formatPatientDateTime(log.updated_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
