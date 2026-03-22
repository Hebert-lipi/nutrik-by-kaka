/** Iniciais a partir do nome completo (até 2 letras). */
export function patientInitials(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase() || "?";
}

/** Idade a partir de YYYY-MM-DD; null se inválido. */
export function patientAgeFromBirthDate(isoDate: string | null | undefined): number | null {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [y, m, d] = isoDate.split("-").map(Number);
  const birth = new Date(y!, m! - 1, d!);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const md = today.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

export function formatPatientDateTime(iso: string | null | undefined, empty = "—"): string {
  if (!iso) return empty;
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatPatientDate(iso: string | null | undefined, empty = "—"): string {
  if (!iso) return empty;
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Início da semana (segunda) em YYYY-MM-DD para comparação com log_date. */
export function weekStartIsoDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
