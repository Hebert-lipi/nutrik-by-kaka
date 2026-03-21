"use client";

/**
 * Login — fundo full-bleed (artes em /public/login/bg-desktop.png e bg-mobile.png),
 * hierarquia alinhada ao mock: logo + título fora do card; rodapé Termos | Contato.
 */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { PremiumLoginShell } from "@/components/auth/premium-login-shell";
import { LoginGlassPanel } from "@/components/auth/login-glass-panel";
import { NutrikLogoMark } from "@/components/auth/nutrik-logo-mark";
import { cn } from "@/lib/utils";

type Step = "email" | "code";
const OTP_CODE_LENGTH = 8;

const COOLDOWN_AFTER_SEND_SEC = 60;
const COOLDOWN_AFTER_429_SEC = 180;

const inputClass =
  "h-12 w-full rounded-full border border-neutral-200/90 bg-white/90 px-5 text-base font-semibold text-text-primary shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all duration-200 placeholder:font-normal placeholder:text-neutral-400 focus:border-primary/50 focus:bg-white focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.03),0_0_0_3px_rgba(197,224,99,0.22)]";

const labelClass = "mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500";

const primaryBtnClass =
  "group relative mt-1 w-full overflow-hidden rounded-full bg-primary py-3.5 text-base font-extrabold text-primary-foreground shadow-[0_14px_40px_-12px_rgba(130,150,50,0.5),inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-black/[0.05] transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_18px_48px_-12px_rgba(130,150,50,0.55)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 disabled:hover:scale-100";

function isRateLimitedError(error: { status?: number; message?: string } | null): boolean {
  if (!error) return false;
  return error.status === 429 || /429|rate limit|too many requests/i.test(error.message ?? "");
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
      options: { shouldCreateUser: true },
    });
    if (error) return { success: false, rateLimited: isRateLimitedError(error) };
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
          message: result.rateLimited ? rateLimitMessage() : "Não foi possível enviar o código. Tente novamente.",
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
      setStatus({ ok: false, message: "Erro de rede. Tente novamente em instantes." });
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
      setStatus({ ok: false, message: "Erro de rede. Tente novamente em instantes." });
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
          message: result.rateLimited ? rateLimitMessage() : "Não foi possível reenviar o código. Tente novamente.",
        });
        if (result.rateLimited) applyCooldownAfter429();
        return;
      }

      applyCooldownAfterSend();
      setStatus({ ok: true, message: "Enviamos um novo código para o seu e-mail." });
    } catch {
      setStatus({ ok: false, message: "Erro de rede. Tente novamente em instantes." });
    } finally {
      sendLockRef.current = false;
      setResending(false);
    }
  }

  const busy = sending || verifying || resending;
  const sendBlockedByCooldown = sendCooldownSec > 0;

  return (
    <PremiumLoginShell>
      <div className="flex min-h-dvh min-h-[100svh] flex-col">
        <main className="flex flex-1 flex-col items-center px-4 pb-8 pt-10 sm:pt-14 md:justify-center md:py-16">
          <div className="motion-safe:animate-login-enter flex w-full max-w-[420px] flex-col items-center">
            <NutrikLogoMark className="mb-8" />

            <header className="mb-6 w-full text-center">
              <h1 className="text-[1.6rem] font-extrabold leading-tight tracking-tight text-text-primary sm:text-[1.85rem]">
                {step === "email" ? "Bem-vindo de volta!" : "Quase lá"}
              </h1>
              <p className="mx-auto mt-3 max-w-[340px] text-body14 leading-relaxed text-text-secondary">
                {step === "email"
                  ? "Digite seu e-mail para receber um código de acesso"
                  : `Enviamos um código para ${trimmedEmail}`}
              </p>
            </header>

            <LoginGlassPanel className="w-full">
              {step === "email" ? (
                <form onSubmit={onSendCode} className="space-y-5">
                  <div>
                    <label htmlFor="login-email" className={labelClass}>
                      E-mail
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="seuemail@dominio.com"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      disabled={sending}
                      className={inputClass}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending || sendBlockedByCooldown}
                    aria-busy={sending}
                    className={primaryBtnClass}
                  >
                    <span className="relative z-[1]">
                      {sending
                        ? "Enviando…"
                        : sendBlockedByCooldown
                          ? `Aguarde ${formatCooldown(sendCooldownSec)}`
                          : "Enviar código"}
                    </span>
                  </button>

                  <p className="text-center text-[13px] leading-relaxed text-neutral-600">
                    {sendBlockedByCooldown ? (
                      <>
                        Próximo envio em{" "}
                        <span className="font-bold tabular-nums text-text-primary">{formatCooldown(sendCooldownSec)}</span>
                      </>
                    ) : (
                      <>Você receberá um código de {OTP_CODE_LENGTH} dígitos no e-mail.</>
                    )}
                  </p>

                  {status ? (
                    <div
                      className={cn(
                        "rounded-2xl border px-4 py-3.5 text-left text-small12 leading-relaxed transition-all duration-300",
                        status.ok
                          ? "border-primary/25 bg-primary/[0.09] text-text-secondary"
                          : "border-orange/35 bg-orange/[0.1] text-text-secondary",
                      )}
                      role="status"
                    >
                      <p className="font-extrabold text-text-primary">{status.ok ? "Tudo certo" : "Atenção"}</p>
                      <p className="mt-1">{status.message}</p>
                    </div>
                  ) : null}
                </form>
              ) : (
                <form onSubmit={onVerifyCode} className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold text-neutral-600">Código enviado</p>
                    <button
                      type="button"
                      onClick={goToEmailStep}
                      disabled={busy}
                      className="text-[12px] font-extrabold text-secondary underline-offset-2 transition-colors hover:text-primary hover:underline disabled:opacity-45"
                    >
                      Usar outro e-mail
                    </button>
                  </div>

                  <div>
                    <label htmlFor="login-code" className={labelClass}>
                      Código de acesso
                    </label>
                    <input
                      id="login-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder={Array.from({ length: OTP_CODE_LENGTH }, () => "0").join("")}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_CODE_LENGTH))}
                      maxLength={OTP_CODE_LENGTH}
                      disabled={verifying}
                      autoFocus
                      className={cn(inputClass, "text-center font-mono text-lg tracking-[0.18em] sm:text-xl")}
                    />
                  </div>

                  {sendBlockedByCooldown ? (
                    <p className="text-center text-[12px] text-neutral-600">
                      Reenvio em <span className="font-bold tabular-nums text-text-primary">{formatCooldown(sendCooldownSec)}</span>
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={verifying || code.replace(/\D/g, "").length !== OTP_CODE_LENGTH}
                    aria-busy={verifying}
                    className={primaryBtnClass}
                  >
                    <span className="relative z-[1]">{verifying ? "Entrando…" : "Entrar"}</span>
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={onResendCode}
                      disabled={busy || sendBlockedByCooldown}
                      className="text-[13px] font-extrabold text-secondary underline-offset-2 transition-colors hover:text-primary hover:underline disabled:pointer-events-none disabled:opacity-45"
                    >
                      {resending ? "Reenviando…" : "Não recebeu? Reenviar código"}
                    </button>
                  </div>

                  {status ? (
                    <div
                      className={cn(
                        "rounded-2xl border px-4 py-3.5 text-left text-small12 leading-relaxed",
                        status.ok
                          ? "border-primary/25 bg-primary/[0.09] text-text-secondary"
                          : "border-orange/35 bg-orange/[0.1] text-text-secondary",
                      )}
                      role="status"
                    >
                      <p className="font-extrabold text-text-primary">{status.ok ? "Sucesso" : "Atenção"}</p>
                      <p className="mt-1">{status.message}</p>
                    </div>
                  ) : null}
                </form>
              )}
            </LoginGlassPanel>
          </div>
        </main>

        <footer className="pb-8 pt-2 text-center text-[13px] text-neutral-600">
          <Link href="/termos" className="font-semibold text-secondary underline-offset-4 transition-colors hover:text-primary hover:underline">
            Termos
          </Link>
          <span className="mx-2.5 inline-block opacity-40" aria-hidden>
            |
          </span>
          <Link href="/contato" className="font-semibold text-secondary underline-offset-4 transition-colors hover:text-primary hover:underline">
            Contato
          </Link>
        </footer>
      </div>
    </PremiumLoginShell>
  );
}
