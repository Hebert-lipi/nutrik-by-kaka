"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonClassName } from "@/components/ui/button";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";
import { useSupabaseDietPlans } from "@/hooks/use-supabase-diet-plans";
import { getPublishedPlanForPatient } from "@/lib/clinical/patient-plan";
import { buildShoppingListFromPlan, groupShoppingByCategory, summarizeShoppingQuality, type ShoppingListItem } from "@/lib/clinical/shopping-list";
import Link from "next/link";
import * as React from "react";
import { fetchShoppingSnapshot, upsertShoppingSnapshot, type ShoppingSnapshot } from "@/lib/supabase/shopping-lists";

export default function PatientListaComprasPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = typeof params.patientId === "string" ? params.patientId : "";
  const { patients, loading } = useSupabasePatients();
  const { plans, loading: plansLoading } = useSupabaseDietPlans();
  const patient = patients.find((p) => p.id === patientId);
  const publishedPlan = patient ? getPublishedPlanForPatient(patient.id, plans) : null;
  const shoppingItems = publishedPlan ? buildShoppingListFromPlan(publishedPlan) : [];
  const [snapshot, setSnapshot] = React.useState<ShoppingSnapshot | null>(null);
  const [workingItems, setWorkingItems] = React.useState<ShoppingListItem[]>([]);
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!patient || !publishedPlan) {
      setSnapshot(null);
      setWorkingItems([]);
      setNotes("");
      return;
    }
    let cancelled = false;
    void fetchShoppingSnapshot(patient.id, publishedPlan.id, Math.max(1, publishedPlan.currentVersionNumber)).then((snap) => {
      if (cancelled) return;
      if (snap) {
        setSnapshot(snap);
        setWorkingItems(snap.items);
        setNotes(snap.notes);
      } else {
        setSnapshot(null);
        setWorkingItems(shoppingItems);
        setNotes("");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [patient?.id, publishedPlan?.id, publishedPlan?.currentVersionNumber, shoppingItems]);

  const sourceItems = snapshot ? snapshot.items : shoppingItems;
  const grouped = groupShoppingByCategory(workingItems);
  const quality = summarizeShoppingQuality(workingItems);

  function updateItem(idx: number, patch: Partial<ShoppingListItem>) {
    setWorkingItems((prev) => prev.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  }

  function removeItem(idx: number) {
    setWorkingItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function addManualItem() {
    setWorkingItems((prev) => [
      ...prev,
      {
        category: "Outros",
        name: "Novo item",
        canonicalName: "novo item",
        quantityLabel: "quantidade orientada pela nutricionista",
        unitNormalized: "un",
        missingQuantity: true,
        unitConflict: false,
      },
    ]);
  }

  async function saveReview(status: "draft" | "reviewed") {
    if (!patient || !publishedPlan) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await upsertShoppingSnapshot({
        patientId: patient.id,
        planId: publishedPlan.id,
        planVersion: Math.max(1, publishedPlan.currentVersionNumber),
        planPublishedAt: publishedPlan.publishedAt ?? null,
        status,
        items: workingItems,
        quality: summarizeShoppingQuality(workingItems),
        notes: notes.trim(),
      });
      setSnapshot(saved);
      setWorkingItems(saved.items);
      setNotes(saved.notes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar revisão.");
    } finally {
      setSaving(false);
    }
  }

  if (!patientId) {
    return <EmptyState title="ID inválido" action={{ label: "Voltar", onClick: () => router.push("/patients") }} />;
  }
  if (loading || plansLoading) {
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
        {!publishedPlan ? (
          <CardContent className="flex flex-col items-center px-6 py-14 text-center md:py-16">
            <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-primary/12 text-2xl shadow-inner ring-1 ring-primary/20" aria-hidden>
              🛒
            </div>
            <p className="mt-6 text-title16 font-semibold text-text-primary">Sem plano publicado</p>
            <p className="mx-auto mt-3 max-w-lg text-body14 font-medium leading-relaxed text-text-secondary">
              Para gerar a lista de compras, publique um plano alimentar ativo para este paciente.
            </p>
            <button
              type="button"
              className={buttonClassName("secondary", "md", "mt-6 rounded-xl font-bold")}
              onClick={() => router.push(`/patients/${patientId}/plano`)}
            >
              Abrir plano alimentar
            </button>
          </CardContent>
        ) : sourceItems.length === 0 ? (
          <CardContent className="flex flex-col items-center px-6 py-14 text-center md:py-16">
            <p className="text-title16 font-semibold text-text-primary">Nenhum item para listar</p>
            <p className="mx-auto mt-3 max-w-lg text-body14 font-medium leading-relaxed text-text-secondary">
              O plano ativo não possui itens suficientes para consolidar uma lista de compras.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link href={`/pdf/diet-plans/${publishedPlan.id}?variant=shopping`} className={buttonClassName("primary", "md", "rounded-xl")}>
                Exportar PDF (compras)
              </Link>
              <button
                type="button"
                className={buttonClassName("outline", "md", "rounded-xl font-bold")}
                onClick={() => router.push(`/diet-plans/${publishedPlan.id}/edit`)}
              >
                Revisar plano
              </button>
            </div>
          </CardContent>
        ) : (
          <CardContent className="space-y-6 px-6 py-6 md:px-8 md:py-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-title16 font-semibold text-text-primary">Lista gerada a partir do plano ativo</p>
                <p className="mt-1 text-small12 text-text-secondary">{publishedPlan.name}</p>
                <p className="mt-1 text-[11px] font-semibold text-text-muted">
                  {snapshot ? `Snapshot v${snapshot.planVersion} · ${snapshot.status === "reviewed" ? "Revisada" : "Em revisão"}` : "Sem snapshot salvo"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/pdf/diet-plans/${publishedPlan.id}?variant=shopping`} className={buttonClassName("primary", "sm", "rounded-xl")}>
                  Exportar PDF
                </Link>
                <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={addManualItem}>
                  Adicionar item
                </Button>
              </div>
            </div>

            {error ? <p className="rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 text-small12 font-semibold text-text-secondary">{error}</p> : null}

            <div className="grid gap-2 rounded-xl border border-neutral-200/70 bg-neutral-50/40 p-3 text-small12 text-text-secondary sm:grid-cols-3">
              <p><span className="font-semibold text-text-primary">{quality.totalItems}</span> itens</p>
              <p><span className="font-semibold text-text-primary">{quality.missingQuantityCount}</span> sem quantidade</p>
              <p><span className="font-semibold text-text-primary">{quality.unitConflictCount}</span> com unidade inconsistente</p>
            </div>

            <div className="space-y-4">
              {grouped.map((group) => (
                <section key={group.category} className="rounded-xl border border-neutral-200/80 bg-bg-0 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-secondary">{group.category}</p>
                  <div className="mt-2 space-y-2">
                    {group.items.map((item) => {
                      const idx = workingItems.findIndex((x) => x === item);
                      return (
                        <div key={`${group.category}-${idx}-${item.name}`} className="grid gap-2 md:grid-cols-[1.2fr_1fr_auto]">
                          <input
                            value={item.name}
                            onChange={(e) => updateItem(idx, { name: e.target.value })}
                            className="h-9 rounded-lg border border-neutral-200/80 bg-bg-0 px-3 text-sm text-text-primary"
                          />
                          <input
                            value={item.quantityLabel}
                            onChange={(e) => updateItem(idx, { quantityLabel: e.target.value, missingQuantity: false })}
                            className="h-9 rounded-lg border border-neutral-200/80 bg-bg-0 px-3 text-sm text-text-primary"
                          />
                          <Button type="button" variant="ghost" size="sm" className="h-9 text-orange" onClick={() => removeItem(idx)}>
                            Remover
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-text-muted">Observação da nutricionista</p>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-neutral-200/90 bg-bg-0 px-3 py-2 text-sm text-text-primary"
                placeholder="Observação opcional para orientar a compra do paciente..."
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-xl" disabled={saving} onClick={() => void saveReview("draft")}>
                Salvar revisão
              </Button>
              <Button type="button" variant="primary" size="sm" className="rounded-xl" disabled={saving} onClick={() => void saveReview("reviewed")}>
                {saving ? "Salvando..." : "Marcar como revisada"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
