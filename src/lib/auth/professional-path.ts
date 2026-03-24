/**
 * Cookie legado `nutrik_professional_path` (opcional): não é usado para autorização.
 * Mantemos apenas limpeza no browser para remover valores antigos após migração para `profiles.onboarding_professional_choice`.
 */
export const LEGACY_PROFESSIONAL_PATH_COOKIE = "nutrik_professional_path";

export function clearLegacyProfessionalPathCookieClient(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LEGACY_PROFESSIONAL_PATH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
