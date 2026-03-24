"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  fetchPendingProfessionalRequests,
  fetchRecentProfessionalRequests,
  reviewProfessionalAccessRequest,
  type ProfessionalAccessRequestRow,
} from "@/lib/supabase/professional-access-requests";
import { formatPatientDateTime } from "@/lib/patients/patient-display";
import { cn } from "@/lib/utils";

type Tab = "pending" | "recent";

export default function SolicitacoesAcessoPage() {
  const router = useRouter();
  const [tab, setTab] = React.useState<Tab>("pending");
  const [pending, setPending] = React.useState<ProfessionalAccessRequestRow[]>([]);
  const [recent, setRecent] = React.useState<ProfessionalAccessRequestRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [noteById, setNoteById] = React.useState<Record<string, string>>({});

  const load = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [p, r] = await Promise.all([fetchPendingProfessionalRequests(), fetchRecentProfessionalRequests(40)]);
      setPending(p);
      setRecent(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function runReview(id: string, approve: boolean) {
    setBusyId(id);
    setError(null);
    try {
      const res = await reviewProfessionalAccessRequest(id, approve, noteById[id] ?? "");
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await load();
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const list = tab === "pending" ? pending : recent;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operação"
        title="Pedidos de acesso profissional"
        description="Analise solicitações de utilizadores que estão como paciente e pediram acesso à área clínica. Aprovar altera o perfil para nutricionista; recusar apenas registra a decisão."
      />

      {error ? (
        <p className="rounded-xl border border-orange/30 bg-orange/10 px-4 py-3 text-small12 font-bold text-text-secondary">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={cn(
            "rounded-full px-4 py-2 text-[12px] font-bold transition",
            tab === "pending" ? "bg-primary text-primary-foreground shadow-sm" : "bg-neutral-100 text-text-secondary hover:bg-neutral-200/80",
          )}
        >
          Pendentes ({pending.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("recent")}
          className={cn(
            "rounded-full px-4 py-2 text-[12px] font-bold transition",
            tab === "recent" ? "bg-primary text-primary-foreground shadow-sm" : "bg-neutral-100 text-text-secondary hover:bg-neutral-200/80",
          )}
        >
          Histórico recente
        </button>
        <Button type="button" variant="outline" size="sm" className="ml-auto rounded-full" onClick={() => void load()} disabled={loading}>
          Atualizar
        </Button>
      </div>

      {loading ? (
        <p className="text-body14 font-semibold text-text-muted">Carregando…</p>
      ) : list.length === 0 ? (
        <Card className="border-dashed border-neutral-200/90">
          <CardContent className="py-12 text-center text-body14 font-semibold text-text-muted">
            {tab === "pending" ? "Nenhum pedido pendente." : "Sem registros recentes."}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {list.map((row) => (
            <li key={row.id}>
              <Card className="overflow-hidden border-neutral-200/70 shadow-premium-sm">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-text-primary">{row.full_name}</p>
                      <p className="mt-1 text-small12 font-semibold text-text-muted">{row.requester_email || row.user_id}</p>
                      {row.professional_registration ? (
                        <p className="mt-1 text-[11px] font-bold text-text-secondary">Registro: {row.professional_registration}</p>
                      ) : null}
                      {row.message?.trim() ? (
                        <p className="mt-2 rounded-lg bg-neutral-50/90 px-3 py-2 text-small12 font-medium text-text-secondary">{row.message}</p>
                      ) : null}
                      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                        Pedido em {formatPatientDateTime(row.created_at)}
                      </p>
                    </div>
                    <Chip
                      tone={
                        row.status === "pending" ? "yellow" : row.status === "approved" ? "success" : "muted"
                      }
                      className="shrink-0 font-bold capitalize"
                    >
                      {row.status === "pending" ? "Pendente" : row.status === "approved" ? "Aprovado" : "Recusado"}
                    </Chip>
                  </div>

                  {row.status !== "pending" && (row.review_note || row.reviewed_at) ? (
                    <p className="text-[11px] font-medium text-text-muted">
                      {row.reviewed_at ? `Analisado em ${formatPatientDateTime(row.reviewed_at)}.` : null}
                      {row.review_note ? ` Nota: ${row.review_note}` : null}
                    </p>
                  ) : null}

                  {row.status === "pending" ? (
                    <div className="space-y-3 border-t border-neutral-100/90 pt-4">
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-text-muted" htmlFor={`note-${row.id}`}>
                        Nota interna (opcional, visível no histórico)
                      </label>
                      <input
                        id={`note-${row.id}`}
                        className="w-full rounded-xl border border-neutral-200/80 bg-bg-0 px-3 py-2 text-small12 font-semibold outline-none focus:border-primary/40"
                        value={noteById[row.id] ?? ""}
                        onChange={(e) => setNoteById((prev) => ({ ...prev, [row.id]: e.target.value }))}
                        placeholder="Motivo da recusa ou referência interna"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          className="rounded-full font-bold"
                          disabled={busyId === row.id}
                          onClick={() => void runReview(row.id, true)}
                        >
                          Aprovar acesso
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full font-bold text-orange"
                          disabled={busyId === row.id}
                          onClick={() => void runReview(row.id, false)}
                        >
                          Recusar
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
