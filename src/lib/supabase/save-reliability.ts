/**
 * Mensagens claras para falhas de gravação (RLS, rede, sessão).
 */
export function humanizeSupabaseSaveError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("row-level security") || m.includes("violates row-level security") || m.includes(" rls")) {
    return "Não foi possível guardar: a sua conta ainda não está autorizada como profissional (ou a sessão expirou). Saia, volte a entrar e, se o aviso continuar, peça ajuda ao suporte Nutrik.";
  }
  if (m.includes("jwt") || m.includes("invalid claim") || m.includes("not authenticated")) {
    return "Sessão expirada ou inválida. Faça login novamente e tente salvar.";
  }
  if (m.includes("violates foreign key") || m.includes("foreign key constraint")) {
    return "Não foi possível guardar: paciente ou referência inválida. Atualize a página e confirme o paciente selecionado.";
  }
  if (m.includes("duplicate key") || m.includes("unique constraint")) {
    return "Conflito ao guardar os dados. Atualize a página e tente de novo.";
  }
  return raw;
}

export function isTransientNetworkError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("load failed") ||
    m.includes("network request failed") ||
    m.includes("econnreset") ||
    m.includes("etimedout") ||
    m.includes("timeout") ||
    m.includes("502") ||
    m.includes("503") ||
    m.includes("504") ||
    m.includes("524") ||
    m.includes("aborted")
  );
}

export async function withTransientRetries<T>(label: string, fn: () => Promise<T>, maxAttempts = 4): Promise<T> {
  const delaysMs = [0, 450, 1200, 2800];
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const d = delaysMs[Math.min(attempt, delaysMs.length - 1)]!;
    if (d > 0) {
      await new Promise((r) => setTimeout(r, d));
    }
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (attempt < maxAttempts - 1 && isTransientNetworkError(msg)) {
        console.warn(`[Nutrik] ${label}: tentativa ${attempt + 1}/${maxAttempts} (rede), a repetir…`, msg);
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}
