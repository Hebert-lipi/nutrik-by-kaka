"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<null | { ok: boolean; message: string }>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setStatus({ ok: false, message: "Por favor, digite um e-mail válido." });
      return;
    }

    setLoading(true);
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
        "https://nutrik-by-kaka-3yft.vercel.app";
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${baseUrl}/dashboard`,
        },
      });

      if (error) {
        setStatus({
          ok: false,
          message: "Não foi possível enviar o link de acesso. Tente novamente.",
        });
        return;
      }

      setStatus({
        ok: true,
        message: "Verifique seu e-mail",
      });
    } catch {
      setStatus({
        ok: false,
        message: "Erro de rede. Tente novamente em instantes.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg-1 px-4 py-10">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 md:gap-8">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-2 text-body14 font-semibold text-primary border border-primary/25">
            Nutrik by Kaká
          </p>
          <h1 className="mt-4 text-h1Bold md:text-h1">Bem-vindo de volta</h1>
          <p className="mt-2 text-body14 text-text-secondary">
            Digite seu e-mail para receber o link de acesso
          </p>
        </div>

        <Card className="w-full rounded-xl p-5 md:p-7">
          <form onSubmit={onSubmit} className="space-y-5">
            <Input
              label="E-mail"
              type="email"
              inputMode="email"
              placeholder="seuemail@dominio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto rounded-lg px-6">
                {loading ? "Enviando..." : "Enviar link de acesso"}
              </Button>

              <p className="text-small12 text-neutral-500">
                Sem senha: você fará login pelo e-mail.
              </p>
            </div>

            {status ? (
              <div
                className={
                  status.ok
                    ? "rounded-lg border border-primary/20 bg-primary/10 p-4 text-text-secondary"
                    : "rounded-lg border border-orange/30 bg-orange/10 p-4 text-text-secondary"
                }
              >
                <p className="text-body14 font-semibold">
                  {status.ok ? "Link enviado com sucesso" : "Ocorreu um erro"}
                </p>
                <p className="mt-1 text-body14 text-text-secondary">{status.message}</p>
              </div>
            ) : null}
          </form>
        </Card>
      </div>
    </div>
  );
}

