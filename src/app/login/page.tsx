"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

type Step = "email" | "code";
const OTP_CODE_LENGTH = 8;

/** Intervalo mínimo entre envios de código (evita 429 por cliques repetidos). */
const COOLDOWN_AFTER_SEND_SEC = 60;
/** Após 429 do Supabase, bloqueio local extra antes de nova tentativa de envio. */
const COOLDOWN_AFTER_429_SEC = 180;

function isRateLimitedError(error: { status?: number; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.status === 429 ||
    /429|rate limit|too many requests/i.test(error.message ?? "")
  );
}

function rateLimitMessage(): string {
  return "Muitas solicitações em pouco tempo. Por segurança, o envio de códigos foi pausado temporariamente. Aguarde alguns minutos e tente novamente.";
}

function formatCooldown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
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
  /** Segundos restantes antes de permitir novo envio / reenvio (0 = liberado). */
  const [sendCooldownSec, setSendCooldownSec] = React.useState(0);

  const sendLockRef = React.useRef(false);
  const verifyLockRef = React.useRef(false);

  const trimmedEmail = email.trim();

  const cooldownActive = sendCooldownSec > 0;
  React.useEffect(() => {
    if (!cooldownActive) return;
    const id = window.setInterval(() => {
      setSendCooldownSec((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldownActive]);

  function goToEmailStep() {
    setStep("email");
    setCode("");
    setStatus(null);
    setSendCooldownSec(0);
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    if (step === "code") {
      setStep("email");
      setCode("");
      setStatus(null);
      setSendCooldownSec(0);
    }
  }

  async function sendOtpToEmail(targetEmail: string): Promise<{ success: boolean; rateLimited?: boolean }> {
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return { success: false, rateLimited: isRateLimitedError(error) };
    }
    return { success: true };
  }

  function applyCooldownAfterSend() {
    setSendCooldownSec((prev) => Math.max(prev, COOLDOWN_AFTER_SEND_SEC));
  }

  function applyCooldownAfter429() {
    setSendCooldownSec((prev) => Math.max(prev, COOLDOWN_AFTER_429_SEC));
  }

  async function onSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (sendLockRef.current || sending || verifying || sendCooldownSec > 0) return;

    setStatus(null);
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setStatus({ ok: false, message: "Por favor, digite um e-mail válido." });
      return;
    }

    sendLockRef.current = true;
    setSending(true);
    try {
      const result = await sendOtpToEmail(trimmedEmail);
      if (!result.success) {
        setStatus({
          ok: false,
          message: result.rateLimited
            ? rateLimitMessage()
            : "Não foi possível enviar o código. Tente novamente.",
        });
        if (result.rateLimited) applyCooldownAfter429();
        return;
      }

      applyCooldownAfterSend();
      setStatus({
        ok: true,
        message: "Enviamos um código para o seu e-mail. Verifique também a caixa de spam.",
      });
      setStep("code");
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
    if (verifyLockRef.current || verifying || sending || resending) return;

    setStatus(null);
    const token = code.replace(/\D/g, "");
    if (token.length !== OTP_CODE_LENGTH) {
      setStatus({
        ok: false,
        message: `Digite o código com ${OTP_CODE_LENGTH} dígitos que você recebeu por e-mail.`,
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
        if (limited) applyCooldownAfter429();
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
    if (sendLockRef.current || resending || sending || verifying || sendCooldownSec > 0) return;

    setStatus(null);
    sendLockRef.current = true;
    setResending(true);
    try {
      const result = await sendOtpToEmail(trimmedEmail);
      if (!result.success) {
        setStatus({
          ok: false,
          message: result.rateLimited
            ? rateLimitMessage()
            : "Não foi possível reenviar o código. Tente novamente.",
        });
        if (result.rateLimited) applyCooldownAfter429();
        return;
      }

      applyCooldownAfterSend();
      setStatus({
        ok: true,
        message: "Enviamos um novo código para o seu e-mail.",
      });
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
  const sendBlockedByCooldown = sendCooldownSec > 0;

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
                  disabled={sending || sendBlockedByCooldown}
                  aria-busy={sending}
                  className="w-full sm:w-auto rounded-lg px-6"
                >
                  {sending ? "Enviando..." : sendBlockedByCooldown ? `Aguarde ${formatCooldown(sendCooldownSec)}` : "Enviar código"}
                </Button>

                <p className="text-small12 text-neutral-500">
                  {sendBlockedByCooldown ? (
                    <>
                      Próximo envio disponível em <span className="font-semibold tabular-nums">{formatCooldown(sendCooldownSec)}</span>.
                    </>
                  ) : (
                    <>Você receberá um código de 6 dígitos no e-mail.</>
                  )}
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
                placeholder="00000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_CODE_LENGTH))}
                maxLength={OTP_CODE_LENGTH}
                disabled={verifying}
                autoFocus
              />

              {sendBlockedByCooldown ? (
                <p className="text-small12 text-neutral-500">
                  Reenvio disponível em <span className="font-semibold tabular-nums">{formatCooldown(sendCooldownSec)}</span>.
                </p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="submit"
                  disabled={verifying || code.replace(/\D/g, "").length !== OTP_CODE_LENGTH}
                  aria-busy={verifying}
                  className="w-full sm:w-auto rounded-lg px-6"
                >
                  {verifying ? "Entrando..." : "Entrar"}
                </Button>

                <button
                  type="button"
                  onClick={onResendCode}
                  disabled={busy || sendBlockedByCooldown}
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
