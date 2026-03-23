"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DietPlanBuilder } from "@/components/diet-plan-builder/diet-plan-builder";
import { NewPlanIntentModal } from "@/components/diet-plan-builder/new-plan-intent-modal";
import { useSupabasePatients } from "@/hooks/use-supabase-patients";

function NewPlanGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { patients, loading } = useSupabasePatients();

  const kind = searchParams.get("kind");
  const patientId = searchParams.get("patientId");

  const ready =
    kind === "template" ||
    (kind === "patient" && Boolean(patientId?.trim())) ||
    Boolean(patientId?.trim());

  if (!ready) {
    if (loading) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center text-body14 font-semibold text-text-muted">
          Carregando…
        </div>
      );
    }
    return (
      <NewPlanIntentModal
        patients={patients}
        onCancel={() => router.push("/diet-plans")}
        onContinue={(intent) => {
          if (intent.kind === "template") {
            router.replace("/diet-plans/new?kind=template");
          } else {
            router.replace(
              `/diet-plans/new?kind=patient&patientId=${encodeURIComponent(intent.patientId)}`,
            );
          }
        }}
      />
    );
  }

  return <DietPlanBuilder mode="new" />;
}

export default function NewDietPlanPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-body14 font-semibold text-text-muted">
          Abrindo construtor…
        </div>
      }
    >
      <NewPlanGate />
    </React.Suspense>
  );
}
