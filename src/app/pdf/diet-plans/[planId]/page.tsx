"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Button, buttonClassName } from "@/components/ui/button";
import { useSupabaseDietPlans } from "@/hooks/use-supabase-diet-plans";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";
import { PlanPdfDocument } from "@/components/plan-pdf/plan-pdf-document";
import type { PlanPdfVariant } from "@/lib/pdf/plan-pdf-model";
import { fetchShoppingSnapshot } from "@/lib/supabase/shopping-lists";
import type { ShoppingListItem } from "@/lib/clinical/shopping-list";
import { measurePerf, recordPerfMetric } from "@/lib/perf/perf-metrics";

const variants: Array<{ id: PlanPdfVariant; label: string }> = [
  { id: "full", label: "PDF completo" },
  { id: "diet", label: "Só dieta" },
  { id: "shopping", label: "Só compras" },
  { id: "recipes", label: "Só receitas" },
];

async function watermarkData(src: string, alpha: number): Promise<{ dataUrl: string; ratio: number }> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = Math.max(1, img.naturalWidth);
      const h = Math.max(1, img.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Não foi possível preparar a marca d'água."));
        return;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, 0, 0, w, h);
      resolve({ dataUrl: canvas.toDataURL("image/png"), ratio: w / h });
    };
    img.onerror = () => reject(new Error("Falha ao carregar imagem da marca d'água."));
    img.src = src;
  });
}

function validVariant(raw: string | null): PlanPdfVariant {
  if (raw === "diet" || raw === "shopping" || raw === "recipes") return raw;
  return "full";
}

export default function DietPlanPdfPage() {
  const params = useParams();
  const search = useSearchParams();
  const planId = typeof params.planId === "string" ? params.planId : "";
  const variant = validVariant(search.get("variant"));
  const autoPrint = search.get("autoprint") === "1";
  const { fetchPlanById } = useSupabaseDietPlans();
  const { patients } = useSupabasePatients();
  const [plan, setPlan] = React.useState<Awaited<ReturnType<typeof fetchPlanById>>>(null);
  const [loading, setLoading] = React.useState(true);
  const printedRef = React.useRef(false);
  const [downloading, setDownloading] = React.useState(false);
  const [shoppingOverride, setShoppingOverride] = React.useState<ShoppingListItem[] | null>(null);
  const mountAtRef = React.useRef<number>(typeof performance !== "undefined" ? performance.now() : Date.now());
  const measuredRef = React.useRef(false);

  React.useEffect(() => {
    let c = false;
    setLoading(true);
    void fetchPlanById(planId)
      .then((p) => {
        if (!c) setPlan(p);
      })
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, [fetchPlanById, planId]);

  React.useEffect(() => {
    document.body.setAttribute("data-nutrik-pdf-page", "true");
    return () => {
      document.body.removeAttribute("data-nutrik-pdf-page");
    };
  }, []);

  React.useEffect(() => {
    if (!autoPrint || loading || !plan || printedRef.current) return;
    printedRef.current = true;
    window.setTimeout(() => window.print(), 180);
  }, [autoPrint, loading, plan]);

  React.useEffect(() => {
    if (!plan?.linkedPatientId) {
      setShoppingOverride(null);
      return;
    }
    let cancelled = false;
    void fetchShoppingSnapshot(plan.linkedPatientId, plan.id, Math.max(1, plan.currentVersionNumber)).then((snap) => {
      if (cancelled) return;
      setShoppingOverride(snap?.items ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [plan?.id, plan?.linkedPatientId, plan?.currentVersionNumber]);
  React.useEffect(() => {
    if (loading || !plan || measuredRef.current) return;
    measuredRef.current = true;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    recordPerfMetric("ui.open.pdf_page", now - mountAtRef.current, variant);
  }, [loading, plan, variant]);

  const downloadPdfFile = React.useCallback(async () => {
    const root = document.getElementById("pdf-print-root");
    if (!root || !plan) return;
    setDownloading(true);
    root.classList.add("pdf-exporting");
    try {
      const mod = await import("html2pdf.js");
      const html2pdf = (mod as { default: any }).default;
      const safeName = (plan.name.trim() || "plano-alimentar")
        .toLowerCase()
        .replace(/[^a-z0-9\-_\s]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      const worker = html2pdf().set({
          margin: [10, 10, 12, 10],
          filename: `${safeName}-${variant}.pdf`,
          pagebreak: {
            mode: ["css", "legacy"],
            avoid: [".pdf-avoid-break", ".pdf-meal-block", ".pdf-meal-group", ".pdf-recipe-block", ".pdf-keep-with-next"],
          },
          image: { type: "jpeg", quality: 0.99 },
          html2canvas: { scale: 2.2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(root)
        .toPdf();

      const pdf = await worker.get("pdf");
      const pageCount = pdf.getNumberOfPages();
      const wm = await watermarkData("/images/nutrik-logo.png", 0.07);
      for (let page = 1; page <= pageCount; page += 1) {
        pdf.setPage(page);
        const pw = pdf.internal.pageSize.getWidth();
        const ph = pdf.internal.pageSize.getHeight();
        const ww = pw * 0.42;
        const wh = ww / wm.ratio;
        const x = (pw - ww) / 2;
        const y = (ph - wh) / 2;
        pdf.addImage(wm.dataUrl, "PNG", x, y, ww, wh, undefined, "FAST");
      }
      await measurePerf("ui.generate_pdf.total", () => worker.save(), variant);
    } finally {
      root.classList.remove("pdf-exporting");
      setDownloading(false);
    }
  }, [plan, variant]);

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-body14 font-semibold text-text-muted">Carregando PDF...</div>;
  }
  if (!plan) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-10">
        <h1 className="text-xl font-semibold text-text-primary">Plano não encontrado</h1>
        <p className="text-sm text-text-secondary">Não foi possível carregar os dados para impressão.</p>
        <Link href="/diet-plans" className={buttonClassName("primary", "md")}>Voltar</Link>
      </div>
    );
  }

  const linkedPatient = plan.linkedPatientId ? patients.find((p) => p.id === plan.linkedPatientId) ?? null : null;

  return (
    <div className="space-y-5 bg-[#f1f5f9] px-4 py-4 md:px-8">
      <div className="pdf-screen-controls sticky top-3 z-40 mx-auto flex w-full max-w-[860px] flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div>
          <p className="text-sm font-semibold text-text-primary">Pré-visualização do PDF</p>
          <p className="mt-0.5 text-[11px] font-semibold text-text-muted">Modo documento (sem elementos do sistema)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/diet-plans/${plan.id}/edit`} className={buttonClassName("outline", "sm")}>Voltar ao plano</Link>
          {variants.map((v) => (
            <Link
              key={v.id}
              href={`/pdf/diet-plans/${plan.id}?variant=${v.id}`}
              className={buttonClassName(v.id === variant ? "secondary" : "outline", "sm")}
            >
              {v.label}
            </Link>
          ))}
          <Button type="button" variant="primary" size="sm" disabled={downloading} onClick={() => void downloadPdfFile()}>
            {downloading ? "Gerando PDF..." : "Baixar PDF"}
          </Button>
        </div>
      </div>
      <div id="pdf-print-root">
        <PlanPdfDocument plan={plan} patient={linkedPatient} variant={variant} shoppingOverride={shoppingOverride} />
      </div>
    </div>
  );
}

