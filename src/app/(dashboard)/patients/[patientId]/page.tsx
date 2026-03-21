"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/dashboard/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Button, buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useDraftPatients, useDraftPlans } from "@/hooks/use-draft-data";
import { patientDietSummary } from "@/lib/clinical/dashboard-snapshot";
import type { PatientClinicalStatus } from "@/lib/draft-storage";
import { getPlansLinkedToPatient } from "@/lib/clinical/patient-plan";

const STATUS_LABEL: Record<PatientClinicalStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  archived: "Arquivado",
};

function formatIso(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = typeof params.patientId === "string" ? params.patientId : "";
  const { patients, updatePatient } = useDraftPatients();
  const { plans } = useDraftPlans();

  const patient = patients.find((p) => p.id === patientId);
  const summary = patient ? patientDietSummary(patient, plans) : null;
  const linked = patient ? getPlansLinkedToPatient(patient.id, plans) : [];

  const [notes, setNotes] = React.useState(patient?.clinicalNotes ?? "");

  React.useEffect(() => {
    setNotes(patient?.clinicalNotes ?? "");
  }, [patient?.clinicalNotes, patient?.id]);

  if (!patientId) {
    return (
      <EmptyState title="Paciente não encontrado" description="ID inválido." action={{ label: "Voltar", onClick: () => router.push("/patients") }} />
    );
  }

  if (!patient) {
    return (
      <EmptyState
        title="Paciente não encontrado"
        description="Este registro não existe no diretório deste dispositivo."
        action={{ label: "Ir para pacientes", onClick: () => router.push("/patients") }}
      />
    );
  }

  const status = patient.clinicalStatus ?? "active";
  const revisions = summary?.publishedPlan?.revisionHistory?.slice(-5).reverse() ?? [];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Paciente"
        title={patient.name}
        description="Visão clínica resumida — vinculação de plano, atualizações e observações internas."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-neutral-100/90 pb-4">
            <p className="text-title16 font-extrabold text-text-primary">Identificação</p>
          </CardHeader>
          <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-text-muted">ID interno</p>
              <p className="mt-1 font-mono text-small12 font-bold text-text-primary">{patient.id}</p>
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-text-muted">E-mail</p>
              <p className="mt-1 font-semibold text-text-primary">{patient.email}</p>
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-text-muted">Status</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Chip tone={status === "active" ? "success" : status === "paused" ? "yellow" : "muted"}>{STATUS_LABEL[status]}</Chip>
                <select
                  aria-label="Alterar status clínico"
                  className="rounded-xl border border-neutral-200/80 bg-bg-0 px-3 py-2 text-small12 font-bold text-text-primary"
                  value={status}
                  onChange={(e) =>
                    updatePatient(patient.id, { clinicalStatus: e.target.value as PatientClinicalStatus })
                  }
                >
                  <option value="active">Ativo</option>
                  <option value="paused">Pausado</option>
                  <option value="archived">Arquivado</option>
                </select>
              </div>
            </div>
            <div className="sm:col-span-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-text-muted">Plano publicado</p>
              <p className="mt-1 font-semibold text-text-primary">
                {summary?.publishedPlan?.name ?? "Nenhum plano publicado vinculado"}
              </p>
              {summary?.lastDietUpdateAt ? (
                <p className="mt-2 text-small12 text-text-secondary">
                  Última revisão registrada: <span className="font-bold text-text-primary">{formatIso(summary.lastDietUpdateAt)}</span>
                </p>
              ) : (
                <p className="mt-2 text-small12 text-text-muted">Sem histórico de revisão salvo ainda.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-neutral-100/90 pb-4">
            <p className="text-title16 font-extrabold text-text-primary">Ações</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-5">
            <Link href={`/patients/${patient.id}/diet`} className={buttonClassName("primary", "md", "w-full justify-center")}>
              Ver cardápio (prévia)
            </Link>
            {summary?.publishedPlan ? (
              <Link
                href={`/diet-plans/${summary.publishedPlan.id}/edit`}
                className={buttonClassName("outline", "md", "w-full justify-center")}
              >
                Editar plano vinculado
              </Link>
            ) : (
              <Link href="/diet-plans/new" className={buttonClassName("outline", "md", "w-full justify-center")}>
                Criar plano para o paciente
              </Link>
            )}
            <Button type="button" variant="secondary" size="md" className="w-full" onClick={() => router.push("/patients")}>
              Voltar ao diretório
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-neutral-100/90 pb-4">
            <p className="text-title16 font-extrabold text-text-primary">Histórico resumido</p>
            <p className="mt-1 text-small12 text-text-secondary">Versões salvas do plano publicado (metadados)</p>
          </CardHeader>
          <CardContent className="pt-5">
            {revisions.length === 0 ? (
              <p className="text-body14 text-text-muted">Sem revisões armazenadas. Ao salvar no construtor, novas entradas aparecerão aqui.</p>
            ) : (
              <ul className="space-y-3">
                {revisions.map((r) => (
                  <li key={r.id} className="rounded-xl border border-neutral-100/90 bg-neutral-50/50 px-3 py-3">
                    <p className="font-bold text-text-primary">v{r.versionNumber} · {r.name}</p>
                    <p className="mt-1 text-[11px] font-semibold text-text-muted">{formatIso(r.savedAt)}</p>
                    {r.changedByLabel ? (
                      <p className="mt-1 text-[11px] font-semibold text-text-secondary">Alterado por {r.changedByLabel}</p>
                    ) : null}
                    <Chip tone={r.status === "published" ? "success" : "yellow"} className="mt-2">
                      {r.status === "published" ? "Publicado" : "Rascunho"}
                    </Chip>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-neutral-100/90 pb-4">
            <p className="text-title16 font-extrabold text-text-primary">Observações clínicas</p>
            <p className="mt-1 text-small12 text-text-secondary">Visível apenas na área da nutricionista (até integração servidor)</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="space-y-2">
              <label htmlFor="clinical-notes" className="block text-small12 font-bold uppercase tracking-wide text-text-muted">
                Notas
              </label>
              <textarea
                id="clinical-notes"
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações internas, alertas, preferências…"
                className="w-full resize-y rounded-xl border border-neutral-200/90 bg-bg-0 px-4 py-3 text-sm text-text-primary shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-neutral-400 focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => updatePatient(patient.id, { clinicalNotes: notes })}
            >
              Salvar observações
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-neutral-100/90 pb-4">
          <p className="text-title16 font-extrabold text-text-primary">Atividade, adesão e registros</p>
          <p className="mt-1 text-small12 text-text-secondary">
            Central de acompanhamento — hoje os registros do paciente ficam no portal <span className="font-bold">Meu plano</span> (local). Em
            produção, sincronizamos com o servidor para métricas e alertas.
          </p>
        </CardHeader>
        <CardContent className="pt-5">
          <ul className="space-y-3 text-body14 text-text-secondary">
            <li className="flex gap-2">
              <span className="font-extrabold text-primary">·</span>
              <span>
                <span className="font-bold text-text-primary">Adesão às refeições</span> — marcação de refeição realizada e nível de dificuldade (paciente).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-extrabold text-primary">·</span>
              <span>
                <span className="font-bold text-text-primary">Observação diária</span> — notas livres do paciente sobre o dia.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-extrabold text-primary">·</span>
              <span>
                <span className="font-bold text-text-primary">Próximos passos</span> — gráficos de adesão, lembretes e integração com wearables (roadmap).
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-neutral-100/90 pb-4">
          <p className="text-title16 font-extrabold text-text-primary">Planos vinculados ({linked.length})</p>
        </CardHeader>
        <CardContent className="pt-5">
          {linked.length === 0 ? (
            <p className="text-body14 text-text-muted">Nenhum plano com vínculo a este paciente.</p>
          ) : (
            <ul className="divide-y divide-neutral-100/90">
              {linked.map((pl) => (
                <li key={pl.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-bold text-text-primary">{pl.name}</p>
                    <p className="text-[11px] font-semibold text-text-muted">{pl.planKind === "patient_plan" ? "Plano do paciente" : "Modelo"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Chip tone={pl.status === "published" ? "success" : "yellow"}>{pl.status === "published" ? "Publicado" : "Rascunho"}</Chip>
                    <Link href={`/diet-plans/${pl.id}/edit`} className={buttonClassName("outline", "sm", "")}>
                      Abrir
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
