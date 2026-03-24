"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { buttonClassName } from "@/components/ui/button";
import { fetchMyProfessionalRequests, fetchMyProfileRole } from "@/lib/supabase/professional-access-requests";
import { isClinicalRole } from "@/lib/auth/user-context";

/**
 * Paciente (ou conta sem staff clínico): lembrete para pedir acesso profissional com aprovação.
 */
export function ProfessionalAccessTeaser() {
  const [ready, setReady] = React.useState(false);
  const [show, setShow] = React.useState(false);
  const [line, setLine] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const role = await fetchMyProfileRole();
      if (cancelled) return;
      if (role && isClinicalRole(role)) {
        setReady(true);
        setShow(false);
        return;
      }
      const reqs = await fetchMyProfessionalRequests();
      if (cancelled) return;
      const pending = reqs.find((r) => r.status === "pending");
      const approved = reqs.some((r) => r.status === "approved");
      if (pending) setLine("Seu pedido de acesso profissional está em análise. Um administrador da clínica vai decidir.");
      else if (approved)
        setLine("Seu acesso foi aprovado. Abra o Painel clínico — se não aparecer, atualize a página ou entre de novo.");
      else setLine(null);
      setShow(true);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready || !show) return null;

  return (
    <Card className="border-secondary/25 bg-secondary/[0.06]">
      <CardContent className="space-y-3 py-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-secondary">Nutricionista?</p>
        {line ? (
          <p className="text-small12 font-semibold leading-relaxed text-text-secondary">{line}</p>
        ) : (
          <p className="text-small12 font-semibold leading-relaxed text-text-secondary">
            Se você é profissional e usa este mesmo login como paciente, pode solicitar acesso à área clínica. A liberação é feita por um administrador, sem
            automação.
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {line?.includes("aprovado") ? (
            <Link href="/dashboard" className={buttonClassName("primary", "sm", "rounded-full font-bold")}>
              Abrir painel clínico
            </Link>
          ) : (
            <Link href="/solicitar-acesso-profissional" className={buttonClassName("primary", "sm", "rounded-full px-5 font-bold")}>
              {line?.includes("análise") ? "Ver status do pedido" : "Abrir formulário de pedido"}
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
