export type MagicLinkResult =
  | { ok: true; message?: string }
  | { ok: false; message?: string };

// MVP stub: UI + API contract is ready; Supabase wiring comes next phase.
export async function sendMagicLink(email: string): Promise<MagicLinkResult> {
  try {
    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) return { ok: false, message: "Não foi possível enviar o link de acesso." };
    const json = (await res.json()) as MagicLinkResult & { stub?: boolean };
    return json.ok ? { ok: true, message: json.message } : { ok: false, message: json.message };
  } catch {
    return { ok: false, message: "Erro de rede. Tente novamente." };
  }
}

