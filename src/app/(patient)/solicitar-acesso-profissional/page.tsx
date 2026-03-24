"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  fetchMyProfessionalRequests,
  fetchMyProfileRole,
  submitProfessionalAccessRequest,
} from "@/lib/supabase/professional-access-requests";
import { isClinicalRole } from "@/lib/auth/user-context";

const labelClass = "mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted";
const inputClass =
  "w-full rounded-xl border border-neutral-200/90 bg-bg-0 px-4 py-3 text-body14 font-semibold text-text-primary outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-primary/15";

export default function SolicitarAcessoProfissionalPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [fullName, setFullName] = React.useState("");
  const [crn, setCrn] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState<null | { ok: boolean; text: string }>(null);
  const [alreadyPending, setAlreadyPending] = React.useState(false);

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
      const mine = await fetchMyProfessionalRequests();
      if (c) return;
      setAlreadyPending(mine.some((r) => r.status === "pending"));
      setLoading(false);
    })();
    return () => {
      c = true;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (!fullName.trim() || fullName.trim().length < 2) {
      setStatus({ ok: false, text: "Informe seu nome completo." });
      return;
    }
    setBusy(true);
    try {
      const res = await submitProfessionalAccessRequest({
        fullName: fullName.trim(),
        professionalRegistration: crn.trim(),
        message: message.trim(),
      });
      if (res.ok) {
        setAlreadyPending(true);
        setStatus({
          ok: true,
          text: "Pedido enviado. A clínica vai analisar e você será avisado quando o acesso for liberado (ou se precisar de mais informações).",
        });
        setFullName("");
        setCrn("");
        setMessage("");
      } else {
        setStatus({ ok: false, text: res.error });
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-body14 font-semibold text-text-muted">Carregando…</div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">Profissional</p>
        <h1 className="mt-1 text-title16 font-semibold text-text-primary md:text-h4">Solicitar acesso à área clínica</h1>
        <p className="mt-2 max-w-2xl text-small12 font-semibold leading-relaxed text-text-secondary">
          Se você é nutricionista e usa o Nutrik também como paciente, pode pedir acesso para gerir a sua prática. O pedido é analisado pela
          clínica — <strong className="text-text-primary">não há liberação automática</strong>.
        </p>
      </div>

      {alreadyPending ? (
        <Card className="border-yellow/30 bg-yellow/[0.08]">
          <CardContent className="py-4 text-small12 font-semibold text-text-secondary">
            Você já tem um pedido <strong className="text-text-primary">em análise</strong>. Aguarde a clínica — não é possível enviar outro enquanto
            este estiver pendente.
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-neutral-200/70 shadow-premium-sm">
        <CardHeader className="border-b border-neutral-100/80 pb-4">
          <p className="text-body14 font-semibold text-text-primary">Formulário de pedido</p>
          <p className="mt-1 text-small12 font-medium text-text-muted">Os dados ajudam a equipe a validar sua identidade profissional.</p>
        </CardHeader>
        <CardContent className="pt-6">
          {status ? (
            <div
              className={`rounded-xl border px-4 py-3 text-small12 font-semibold ${
                status.ok ? "border-secondary/35 bg-secondary/[0.08] text-text-secondary" : "border-orange/35 bg-orange/[0.08] text-text-secondary"
              }`}
            >
              {status.text}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 space-y-5" aria-disabled={alreadyPending}>
            <div>
              <label htmlFor="pro-name" className={labelClass}>
                Nome completo (profissional)
              </label>
              <input
                id="pro-name"
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                placeholder="Como consta no registro profissional"
                required
                minLength={2}
                disabled={alreadyPending}
              />
            </div>
            <div>
              <label htmlFor="pro-crn" className={labelClass}>
                Registro profissional (opcional)
              </label>
              <input
                id="pro-crn"
                className={inputClass}
                value={crn}
                onChange={(e) => setCrn(e.target.value)}
                placeholder="Ex.: CRN 12345 / região"
                disabled={alreadyPending}
              />
            </div>
            <div>
              <label htmlFor="pro-msg" className={labelClass}>
                Mensagem para a clínica (opcional)
              </label>
              <textarea
                id="pro-msg"
                className={`${inputClass} min-h-[100px] resize-y`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Vínculo com a clínica, período de estágio, etc."
                disabled={alreadyPending}
              />
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" variant="primary" size="md" className="rounded-full px-8 font-bold" disabled={busy || alreadyPending}>
                {busy ? "Enviando…" : "Enviar pedido"}
              </Button>
              <Link href="/meu-plano" className={buttonClassName("outline", "md", "rounded-full px-6")}>
                Voltar ao meu plano
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
