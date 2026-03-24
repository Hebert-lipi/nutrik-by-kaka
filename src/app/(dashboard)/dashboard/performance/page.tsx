"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/dashboard/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clearPerfMetrics, getPerfSummary, getRecentPerfMetrics, type PerfMetric } from "@/lib/perf/perf-metrics";

type SummaryRow = {
  key: string;
  count: number;
  avgMs: number;
  p95Ms: number;
};

type SlaTone = "ok" | "warn" | "bad";

const SLA_TARGETS_P95: Record<string, { good: number; warn: number; label: string }> = {
  "ui.route.settle": { good: 1200, warn: 2500, label: "Troca de rota percebida" },
  "ui.open.patient_summary": { good: 1200, warn: 2500, label: "Abrir paciente (resumo)" },
  "ui.open.patient_assessments": { good: 1500, warn: 3000, label: "Abrir paciente (avaliações)" },
  "patients.refresh.query": { good: 500, warn: 1200, label: "Query de pacientes" },
  "dietPlans.refresh.query": { good: 500, warn: 1200, label: "Query de planos" },
};

function getSlaTone(key: string, p95Ms: number): SlaTone {
  const target = SLA_TARGETS_P95[key];
  if (!target) return "warn";
  if (p95Ms <= target.good) return "ok";
  if (p95Ms <= target.warn) return "warn";
  return "bad";
}

function toneChipClass(tone: SlaTone): string {
  if (tone === "ok") return "bg-secondary/15 text-secondary ring-secondary/25";
  if (tone === "bad") return "bg-orange/15 text-orange ring-orange/25";
  return "bg-yellow/20 text-yellow-900 ring-yellow/30";
}

function toneLabel(tone: SlaTone): string {
  if (tone === "ok") return "Verde";
  if (tone === "bad") return "Vermelho";
  return "Amarelo";
}

export default function PerformancePage() {
  const [summary, setSummary] = React.useState<SummaryRow[]>([]);
  const [recent, setRecent] = React.useState<PerfMetric[]>([]);

  const reload = React.useCallback(() => {
    const nextSummary = getPerfSummary().sort((a, b) => b.p95Ms - a.p95Ms);
    const nextRecent = getRecentPerfMetrics(80).reverse();
    setSummary(nextSummary);
    setRecent(nextRecent);
  }, []);

  React.useEffect(() => {
    reload();
    const id = window.setInterval(reload, 1500);
    return () => window.clearInterval(id);
  }, [reload]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Observabilidade"
        title="Performance de navegação"
        description="Métricas locais em tempo real (ms) para identificar gargalos de abertura de página, queries e troca de rotas."
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={reload}>
          Atualizar
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-orange"
          onClick={() => {
            clearPerfMetrics();
            reload();
          }}
        >
          Limpar métricas
        </Button>
      </div>

      <Card className="border-neutral-200/70">
        <CardHeader className="border-b border-neutral-100/90 pb-3">
          <p className="text-title16 font-semibold text-text-primary">SLA visual (P95)</p>
          <p className="mt-1 text-small12 text-text-secondary">
            Verde = dentro da meta, Amarelo = atenção, Vermelho = fora do aceitável.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {summary.length === 0 ? (
            <p className="text-small12 font-semibold text-text-muted">Sem dados para avaliar SLA.</p>
          ) : (
            Object.entries(SLA_TARGETS_P95).map(([key, target]) => {
              const row = summary.find((item) => item.key === key);
              const p95 = row?.p95Ms ?? 0;
              const tone = getSlaTone(key, p95);
              return (
                <div key={key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200/80 bg-neutral-50/40 px-3 py-2.5">
                  <div>
                    <p className="text-small12 font-semibold text-text-primary">{target.label}</p>
                    <p className="text-[11px] text-text-muted">
                      {key} - meta P95: ate {target.good}ms (alerta ate {target.warn}ms)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-small12 font-semibold text-text-secondary">P95 atual: {p95}ms</span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${toneChipClass(tone)}`}>
                      {toneLabel(tone)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="border-neutral-200/70">
        <CardHeader className="border-b border-neutral-100/90 pb-3">
          <p className="text-title16 font-semibold text-text-primary">Resumo por métrica</p>
        </CardHeader>
        <CardContent className="p-0">
          {summary.length === 0 ? (
            <p className="p-5 text-small12 font-semibold text-text-muted">Ainda sem dados. Navegue pelo sistema para coletar métricas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-small12">
                <thead className="bg-neutral-50/80">
                  <tr>
                    <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-text-muted">Métrica</th>
                    <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-text-muted">Ocorrências</th>
                    <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-text-muted">Média (ms)</th>
                    <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-text-muted">P95 (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((row) => (
                    <tr key={row.key} className="border-t border-neutral-100/90">
                      <td className="px-4 py-2 font-semibold text-text-primary">{row.key}</td>
                      <td className="px-4 py-2 text-text-secondary">{row.count}</td>
                      <td className="px-4 py-2 text-text-secondary">{row.avgMs}</td>
                      <td className="px-4 py-2 font-semibold text-text-primary">{row.p95Ms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-neutral-200/70">
        <CardHeader className="border-b border-neutral-100/90 pb-3">
          <p className="text-title16 font-semibold text-text-primary">Eventos recentes</p>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <p className="p-5 text-small12 font-semibold text-text-muted">Sem eventos recentes.</p>
          ) : (
            <div className="max-h-[420px] overflow-y-auto [scrollbar-gutter:stable]">
              <ul className="divide-y divide-neutral-100/90">
                {recent.map((item, idx) => (
                  <li key={`${item.key}-${item.atIso}-${idx}`} className="px-4 py-2.5">
                    <p className="text-small12 font-semibold text-text-primary">
                      {item.key} - {item.durationMs}ms
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {item.detail ?? "sem detalhe"} - {new Date(item.atIso).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

