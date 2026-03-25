"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { NutrikLogoMark } from "@/components/auth/nutrik-logo-mark";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { fetchMyProfileRole } from "@/lib/supabase/professional-access-requests";
import { isClinicalRole } from "@/lib/auth/user-context";
import { clearLegacyProfessionalPathCookieClient } from "@/lib/auth/professional-path";
import { claimSoloNutritionistAccess } from "@/lib/supabase/claim-solo-nutritionist";
import { markProfessionalClinicFlow } from "@/lib/supabase/professional-onboarding";

export default function ComoUsaNutrikPage() {
  const router = useRouter();
  const [checking, setChecking] = React.useState(true);
  const [busy, setBusy] = React.useState<"solo" | "clinic" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [soloFeedback, setSoloFeedback] = React.useState<null | "already" | "ok">(null);

  React.useEffect(() => {
    let c = false;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      const role = await fetchMyProfileRole();
      if (c) return;
      if (role && isClinicalRole(role)) {
        router.replace("/dashboard");
        return;
      }
      clearLegacyProfessionalPathCookieClient();
      setChecking(false);
    })();
    return () => {
      c = true;
    };
  }, [router]);

  async function onSolo() {
    setError(null);
    setSoloFeedback(null);
    setBusy("solo");
    try {
      const res = await claimSoloNutritionistAccess();
      if (!res.ok) {
        setError(
          res.error ??
            "Não foi possível ativar o modo profissional. Tente de novo em alguns minutos ou contacte o suporte Nutrik.",
        );
        return;
      }
      clearLegacyProfessionalPathCookieClient();
      setSoloFeedback(res.already ? "already" : "ok");
      await new Promise((r) => setTimeout(r, res.already ? 400 : 700));
      router.refresh();
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setBusy(null);
    }
  }

  async function onClinic() {
    setError(null);
    setSoloFeedback(null);
    setBusy("clinic");
    try {
      const res = await markProfessionalClinicFlow();
      if (!res.ok) {
        setError(res.error ?? "Não foi possível registrar a escolha.");
        return;
      }
      clearLegacyProfessionalPathCookieClient();
      await new Promise((r) => setTimeout(r, 450));
      router.refresh();
      router.replace("/acesso-profissional");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setBusy(null);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-bg-1 to-neutral-50 text-body14 font-semibold text-text-muted">
        Carregando…
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-bg-1 via-bg-1 to-[rgb(var(--color-neutral-50))] px-4 py-10 md:py-14">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-8">
        <NutrikLogoMark className="justify-center" />
        <Card className="w-full border-neutral-200/70 shadow-premium-sm">
          <CardHeader className="space-y-2 border-b border-neutral-100/90 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">Conta profissional</p>
            <h1 className="text-title16 font-semibold text-text-primary md:text-h4">Como você usa o Nutrik?</h1>
            <p className="text-small12 font-semibold leading-relaxed text-text-secondary">
              Escolha o modelo que combina com você. A decisão fica registrada de forma segura no servidor quando necessário (fluxo clínica).
            </p>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {error ? (
              <p className="rounded-xl border border-orange/30 bg-orange/10 px-4 py-3 text-small12 font-bold text-text-secondary">{error}</p>
            ) : null}
            {soloFeedback ? (
              <div className="rounded-xl border border-secondary/30 bg-secondary/[0.08] px-4 py-3 text-small12 font-semibold text-text-secondary">
                {soloFeedback === "already" ? (
                  <span>Sua conta já estava no modo profissional. Abrindo o painel…</span>
                ) : (
                  <span>Tudo certo. Abrindo o painel…</span>
                )}
              </div>
            ) : null}

            <section className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone="primary" className="font-bold">
                  Opção A
                </Chip>
                <p className="text-body14 font-bold text-text-primary">Trabalhar sozinho</p>
              </div>
              <p className="mt-2 text-[11px] font-medium leading-relaxed text-text-secondary">
                Você recebe um espaço profissional só seu (uma clínica pessoal no sistema), entra no painel na hora e não precisa de aprovação de
                administrador. Ideal para consultório individual ou primeiro uso do Nutrik.
              </p>
              <Button
                type="button"
                variant="primary"
                className="mt-4 h-12 w-full rounded-xl font-bold"
                disabled={busy !== null || soloFeedback !== null}
                onClick={() => void onSolo()}
              >
                {busy === "solo" ? "Preparando seu acesso…" : "Trabalhar sozinho"}
              </Button>
            </section>

            <section className="rounded-xl border border-neutral-200/80 bg-bg-0 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone="muted" className="font-bold">
                  Opção B
                </Chip>
                <p className="text-body14 font-bold text-text-primary">Fazer parte de uma clínica</p>
              </div>
              <p className="mt-2 text-[11px] font-medium leading-relaxed text-text-secondary">
                Você será direcionado para solicitar acesso profissional. Um administrador da clínica analisa e libera o painel quando fizer sentido.
                Use quando já faz parte de uma equipe ou consultório com gestão centralizada.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 h-12 w-full rounded-xl font-bold"
                disabled={busy !== null || soloFeedback !== null}
                onClick={() => void onClinic()}
              >
                {busy === "clinic" ? "Registrando e abrindo próxima etapa…" : "Fazer parte de uma clínica"}
              </Button>
            </section>

            <Link href="/login" className={buttonClassName("ghost", "sm", "mx-auto block text-center")}>
              Voltar ao login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
