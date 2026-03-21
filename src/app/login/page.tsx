"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

type Step = "email" | "code";

function isRateLimitedError(error: { status?: number; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.status === 429 ||
    /429|rate limit|too many requests/i.test(error.message ?? "")
  );
}

function rateLimitMessage(): string {
  return "Limite de tentativas atingido (proteção do serviço). Aguarde alguns minutos antes de pedir outro código ou tente outra conexão de internet.";
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("email");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [status, setStatus] = React.useState<null | { ok: boolean; message: string }>(null);

  const sendLockRef = React.useRef(false);
  const verifyLockRef = React.useRef(false);

  const trimmedEmail = email.trim();

  function goToEmailStep() {
    setStep("email");
    setCode("");
    setStatus(null);
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    if (step === "code") {
      setStep("email");
      setCode("");
      setStatus(null);
    }
  }

  async function sendOtpToEmail(targetEmail: string): Promise<boolean> {
    // Sem emailRedirectTo → Supabase envia código OTP por e-mail (não magic link).
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      const limited = isRateLimitedError(error);
      setStatus({
        ok: false,
        message: limited
          ? rateLimitMessage()
          : "Não foi possível enviar o código. Tente novamente.",
      });
      return false;
    }

    setStatus({
      ok: true,
      message: "Enviamos um código de 6 dígitos para o seu e-mail. Verifique também a caixa de spam.",
    });
    return true;
  }

  async function onSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (sendLockRef.current || sending || verifying) return;

    setStatus(null);
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setStatus({ ok: false, message: "Por favor, digite um e-mail válido." });
      return;
    }

    sendLockRef.current = true;
    setSending(true);
    try {
      const ok = await sendOtpToEmail(trimmedEmail);
      if (ok) setStep("code");
    } catch {
      setStatus({
        ok: false,
        message: "Erro de rede. Tente novamente em instantes.",
      });
    } finally {
      sendLockRef.current = false;
      setSending(false);
    }
  }

  async function onVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (verifyLockRef.current || verifying || sending) return;

    setStatus(null);
    const token = code.replace(/\D/g, "");
    if (token.length < 6) {
      setStatus({
        ok: false,
        message: "Digite o código de 6 dígitos que você recebeu por e-mail.",
      });
      return;
    }

    verifyLockRef.current = true;
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token,
        type: "email",
      });

      if (error) {
        const limited = isRateLimitedError(error);
        const looksLikeBadCode =
          !limited &&
          (error.status === 400 ||
            error.status === 401 ||
            error.status === 403 ||
            /expired|invalid.*token|invalid.*otp|wrong.*otp/i.test(error.message ?? ""));
        setStatus({
          ok: false,
          message: limited
            ? rateLimitMessage()
            : looksLikeBadCode
              ? "Código inválido ou expirado. Peça um novo código ou confira os dígitos."
              : "Não foi possível entrar. Tente novamente.",
        });
        return;
      }

      router.refresh();
      router.replace("/dashboard");
    } catch {
      setStatus({
        ok: false,
        message: "Erro de rede. Tente novamente em instantes.",
      });
    } finally {
      verifyLockRef.current = false;
      setVerifying(false);
    }
  }

  async function onResendCode() {
    if (sendLockRef.current || resending || sending || verifying) return;
    setStatus(null);
    sendLockRef.current = true;
    setResending(true);
    try {
      await sendOtpToEmail(trimmedEmail);
    } catch {
      setStatus({
        ok: false,
        message: "Erro de rede. Tente novamente em instantes.",
      });
    } finally {
      sendLockRef.current = false;
      setResending(false);
    }
  }

  const busy = sending || verifying || resending;

  return (
    <div className="min-h-dvh bg-bg-1 px-4 py-10">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 md:gap-8">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-2 text-body14 font-semibold text-primary border border-primary/25">
            Nutrik by Kaká
          </p>
          <h1 className="mt-4 text-h1Bold md:text-h1">Bem-vindo de volta</h1>
          <p className="mt-2 text-body14 text-text-secondary">
            {step === "email"
              ? "Digite seu e-mail para receber um código de acesso"
              : `Digite o código enviado para ${trimmedEmail}`}
          </p>
        </div>

        <Card className="w-full rounded-xl p-5 md:p-7">
          {step === "email" ? (
            <form onSubmit={onSendCode} className="space-y-5">
              <Input
                label="E-mail"
                type="email"
                inputMode="email"
                placeholder="seuemail@dominio.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                autoComplete="email"
                disabled={sending}
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="submit"
                  disabled={sending}
                  aria-busy={sending}
                  className="w-full sm:w-auto rounded-lg px-6"
                >
                  {sending ? "Enviando..." : "Enviar código"}
                </Button>

                <p className="text-small12 text-neutral-500">
                  Você receberá um código de 6 dígitos no e-mail.
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
                    {status.ok ? "Quase lá" : "Ocorreu um erro"}
                  </p>
                  <p className="mt-1 text-body14 text-text-secondary">{status.message}</p>
                </div>
              ) : null}
            </form>
          ) : (
            <form onSubmit={onVerifyCode} className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-small12 text-neutral-500">Código enviado para {trimmedEmail}</p>
                <button
                  type="button"
                  onClick={goToEmailStep}
                  disabled={busy}
                  className="text-small12 font-semibold text-primary underline-offset-2 hover:underline disabled:opacity-50"
                >
                  Usar outro e-mail
                </button>
              </div>

              <Input
                label="Código de acesso"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                disabled={verifying}
                autoFocus
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="submit"
                  disabled={verifying || code.replace(/\D/g, "").length < 6}
                  aria-busy={verifying}
                  className="w-full sm:w-auto rounded-lg px-6"
                >
                  {verifying ? "Entrando..." : "Entrar"}
                </Button>

                <button
                  type="button"
                  onClick={onResendCode}
                  disabled={busy}
                  className="text-left text-small12 font-semibold text-primary underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-50 sm:text-right"
                >
                  {resending ? "Reenviando..." : "Não recebeu? Reenviar código"}
                </button>
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
                    {status.ok ? "Tudo certo" : "Ocorreu um erro"}
                  </p>
                  <p className="mt-1 text-body14 text-text-secondary">{status.message}</p>
                </div>
              ) : null}
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
