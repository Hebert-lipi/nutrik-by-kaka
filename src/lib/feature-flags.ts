/**
 * Flags de rollout para migração workspace.
 * Mantidos simples para permitir fallback rápido sem refactor.
 */
function envFlagOn(value: string | undefined): boolean {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export const workspaceDualReadEnabled = envFlagOn(process.env.NEXT_PUBLIC_WORKSPACE_DUAL_READ);
export const workspaceCutoverEnabled = envFlagOn(process.env.NEXT_PUBLIC_WORKSPACE_CUTOVER);
