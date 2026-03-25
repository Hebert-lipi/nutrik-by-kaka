/** Data local do dispositivo no formato usado em `patient_adherence_logs.log_date`. */
export function todayPortalLogDate(): string {
  return formatPortalYmd(new Date());
}

export function yesterdayPortalLogDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatPortalYmd(d);
}

export function formatPortalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysYmd(ymd: string, deltaDays: number): string {
  const [y, mo, da] = ymd.split("-").map(Number);
  const d = new Date(y!, mo! - 1, da!);
  d.setDate(d.getDate() + deltaDays);
  return formatPortalYmd(d);
}

export function startOfMonthYmd(ymd: string): string {
  const [y, mo] = ymd.split("-").map(Number);
  return `${y}-${String(mo).padStart(2, "0")}-01`;
}
