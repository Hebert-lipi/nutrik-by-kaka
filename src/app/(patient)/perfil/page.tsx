"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button, buttonClassName } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

export default function PatientPerfilPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState<string | null>(null);
  const [name, setName] = React.useState<string | null>(null);
  const [signingOut, setSigningOut] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      const u = data.user;
      const meta = u.user_metadata as Record<string, unknown> | undefined;
      const full = typeof meta?.full_name === "string" ? meta.full_name.trim() : "";
      const n = typeof meta?.name === "string" ? meta.name.trim() : "";
      setEmail(u.email ?? null);
      setName(full || n || null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Perfil</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-text-secondary">
          Informações da sua conta no portal do paciente. Use o menu no topo para aceder rapidamente a qualquer página.
        </p>
      </div>

      <Card className="overflow-hidden border-neutral-200/70 bg-white/95 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.03]">
        <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 px-5 pb-4 pt-5 md:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Dados da conta</p>
          <p className="mt-1 text-sm font-semibold text-text-primary">Identificação</p>
        </CardHeader>
        <CardContent className="space-y-6 px-5 pb-6 pt-6 md:px-6">
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Nome</dt>
              <dd className="mt-1.5 text-[15px] font-medium text-text-primary">{name ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">E-mail</dt>
              <dd className="mt-1.5 break-all text-[15px] font-medium text-text-primary">{email ?? "—"}</dd>
            </div>
          </dl>

          <div className="border-t border-neutral-100 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Ações</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/meu-plano" className={buttonClassName("primary", "md", "justify-center sm:min-w-[12rem]")}>
                Voltar ao meu plano
              </Link>
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={signingOut}
                className={cn("justify-center sm:min-w-[10rem]", signingOut && "opacity-60")}
                onClick={() => void handleSignOut()}
              >
                {signingOut ? "A sair…" : "Sair da conta"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
