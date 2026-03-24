"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { buttonClassName } from "@/components/ui/button";
import { fetchMyProfessionalRequests, fetchMyProfileRole } from "@/lib/supabase/professional-access-requests";
import { isClinicalRole } from "@/lib/auth/user-context";

export default function AcessoProfissionalPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [hasPending, setHasPending] = React.useState(false);
  const [hasRejected, setHasRejected] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }

      const role = await fetchMyProfileRole();
      if (cancelled) return;
      if (role && isClinicalRole(role)) {
        router.replace("/dashboard");
        return;
      }

      const reqs = await fetchMyProfessionalRequests();
      if (cancelled) return;
      setHasPending(reqs.some((r) => r.status === "pending"));
      setHasRejected(reqs.some((r) => r.status === "rejected"));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return <div className="flex min-h-[48vh] items-center justify-center text-body14 font-semibold text-text-muted">Carregando...</div>;
  }

  const primaryLabel = hasPending ? "Ver status do pedido" : "Solicitar acesso profissional";
  const helper = hasPending
    ? "Seu pedido esta em analise por um administrador da clinica. Acompanhe o status no formulario."
    : hasRejected
      ? "Seu ultimo pedido foi recusado. Voce pode enviar uma nova solicitacao com mais contexto."
      : "Para entrar no painel clinico, um administrador precisa aprovar seu acesso profissional.";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
      <Card className="border-neutral-200/70 shadow-premium-sm">
        <CardHeader className="space-y-2 border-b border-neutral-100/80 pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">Entrada profissional</p>
          <h1 className="text-title16 font-semibold text-text-primary md:text-h4">Sua conta ainda nao tem acesso profissional</h1>
          <p className="text-small12 font-semibold leading-relaxed text-text-secondary">{helper}</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/60 px-4 py-3 text-small12 font-semibold text-text-secondary">
            Caminho escolhido no login: <strong className="text-text-primary">Entrar como Nutricionista</strong>.
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/solicitar-acesso-profissional" className={buttonClassName("primary", "md", "rounded-full px-6 font-bold")}>
              {primaryLabel}
            </Link>
            <Link href="/meu-plano" className={buttonClassName("outline", "md", "rounded-full px-6")}>
              Entrar como paciente
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
