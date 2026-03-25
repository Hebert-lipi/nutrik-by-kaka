"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useWeeklyAdherenceSummary } from "@/hooks/use-weekly-adherence-summary";
import { addDaysYmd, formatPortalYmd, todayPortalLogDate } from "@/lib/clinical/patient-portal-dates";

/** Arco com duas fileiras: exterior (bolinhas maiores) e interior (finas), mesmo progresso. */
function DottedSemicircleArc({ progressPct }: { progressPct: number }) {
  const n = 36;
  const pct = Math.min(100, Math.max(0, progressPct));
  const filled = Math.round((pct / 100) * n);
  const cx = 100;
  const cy = 88;
  const ROuter = 76;
  const RInner = 60;
  const denom = Math.max(1, n - 1);

  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = i / denom;
    const theta = Math.PI * (1 - t);
    const x = cx + ROuter * Math.cos(theta);
    const y = cy - ROuter * Math.sin(theta);
    const isOn = i < filled;
    nodes.push(
      <circle
        key={`fat-${i}`}
        cx={x}
        cy={y}
        r={4}
        className={cn("transition-colors duration-500", isOn ? "fill-secondary" : "fill-neutral-200")}
      />,
    );
  }
  for (let i = 0; i < n; i += 1) {
    const t = i / denom;
    const theta = Math.PI * (1 - t);
    const x = cx + RInner * Math.cos(theta);
    const y = cy - RInner * Math.sin(theta);
    const isOn = i < filled;
    nodes.push(
      <circle
        key={`thin-${i}`}
        cx={x}
        cy={y}
        r={2.15}
        className={cn("transition-colors duration-500", isOn ? "fill-secondary" : "fill-neutral-300")}
      />,
    );
  }

  /** Largura fluida: preenche o cartão; viewBox 2:1 define altura via `h-auto`. */
  return (
    <svg
      viewBox="0 0 200 100"
      preserveAspectRatio="xMidYMid meet"
      className="mx-auto block h-auto w-full max-w-[min(100%,22rem)] sm:max-w-[min(100%,28rem)] lg:max-w-[min(100%,36rem)]"
      aria-hidden
    >
      {nodes}
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

function heroMessage(progressPct: number, overdueCount: number, viewIsToday: boolean): string {
  if (!viewIsToday) {
    return "Está a rever um dia anterior. Pode marcar ou corrigir registos como se tivesse sido nesse dia.";
  }
  if (progressPct >= 100) {
    return "Excelente — completou todas as refeições planeadas para hoje.";
  }
  if (overdueCount > 0) {
    return `Há ${overdueCount} refeição(ões) com horário sugerido já passado. Registe quando cumprir ou fale com a sua nutricionista.`;
  }
  if (progressPct >= 50) {
    return "Meio caminho — mantenha o ritmo até ao fim do dia.";
  }
  if (progressPct > 0) {
    return "Bom arranque. Cada marcação conta para o seu acompanhamento.";
  }
  return "Quando realizar uma refeição, marque-a em baixo para registar o progresso.";
}

function HeroStatRow({
  label,
  value,
  icon,
  iconWrapClass,
  compact,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconWrapClass: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 first:pt-0 last:pb-0",
        compact ? "py-2" : "gap-4 py-3.5",
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-full",
            compact ? "h-8 w-8" : "h-9 w-9",
            iconWrapClass,
          )}
        >
          {icon}
        </span>
        <span className={cn("truncate font-medium text-text-secondary", compact ? "text-[13px]" : "text-[15px]")}>
          {label}
        </span>
      </div>
      <span className={cn("shrink-0 font-bold tabular-nums text-text-primary", compact ? "text-xl" : "text-2xl")}>
        {value}
      </span>
    </div>
  );
}

/** Gráfico de barras dos últimos 7 dias. `embed` = card compacto (ex.: abaixo do calendário). `anchorId` para scroll (ex.: `seu-progresso-semanal`). */
export function PatientWeeklyProgressChart({
  patientId,
  planId,
  mealsCount,
  enabled,
  variant = "standalone",
  anchorId,
}: {
  patientId: string;
  planId: string;
  mealsCount: number;
  enabled: boolean;
  variant?: "embed" | "standalone";
  anchorId?: string;
}) {
  const { last7Days, weekCompletedTotal, loading, error } = useWeeklyAdherenceSummary(
    patientId,
    planId,
    mealsCount,
    enabled,
  );
  const denom = Math.max(1, mealsCount);
  const isEmbed = variant === "embed";
  const maxH = isEmbed ? 44 : 88;
  const barWrapH = isEmbed ? "h-12" : "h-[5.5rem]";

  const bars = (
    <div
      className={cn("flex items-end justify-between gap-0.5 sm:gap-1.5", isEmbed ? "mt-2 h-14" : "mt-6 h-[7.5rem]")}
      role="img"
      aria-label="Barras dos últimos sete dias"
    >
      {last7Days.map((day) => {
        const h = denom ? Math.round((day.completed / denom) * maxH) : 0;
        const label = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric" }).format(
          new Date(`${day.date}T12:00:00`),
        );
        return (
          <div key={day.date} className={cn("flex min-w-0 flex-1 flex-col items-center", isEmbed ? "gap-1" : "gap-2")}>
            <div className={cn("flex w-full max-w-[2.25rem] items-end justify-center sm:max-w-[2.75rem]", barWrapH)}>
              <div
                className={cn(
                  "w-full bg-gradient-to-t from-secondary/85 to-primary/80 transition-all duration-500",
                  isEmbed ? "max-w-[2rem] rounded-t-md sm:max-w-[2.25rem]" : "max-w-[2.25rem] rounded-t-lg",
                )}
                style={{ height: `${Math.max(h, day.completed > 0 ? (isEmbed ? 5 : 6) : 2)}px` }}
                title={`${day.completed}/${day.total} em ${day.date}`}
              />
            </div>
            <span
              className={cn(
                "text-center font-semibold capitalize leading-tight text-text-muted",
                isEmbed ? "text-[9px] leading-tight" : "text-[10px]",
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );

  if (isEmbed) {
    return (
      <div
        id={anchorId}
        className="w-full max-w-full rounded-[1.35rem] border border-neutral-200/55 bg-white/95 px-3 py-3 shadow-[0_20px_48px_-32px_rgba(34,110,72,0.1)] ring-1 ring-emerald-100/25 sm:px-4 sm:py-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-secondary">Histórico</p>
            <p className="mt-0.5 text-[12px] font-semibold leading-tight tracking-tight text-text-primary">7 dias</p>
          </div>
          <p className="shrink-0 text-right text-[10px] font-medium leading-snug text-text-secondary">
            <span className="text-base font-bold tabular-nums text-secondary">{weekCompletedTotal}</span>
            <span className="block text-[9px] text-text-muted">ref. feitas</span>
          </p>
        </div>
        {error ? <p className="mt-1 text-[10px] font-semibold text-orange">{error}</p> : null}
        {loading ? (
          <div className="mt-2 flex h-14 items-end justify-between gap-1" aria-hidden>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div className="h-10 w-full max-w-[1.5rem] animate-pulse rounded-t-md bg-neutral-200/70" />
                <div className="h-2 w-6 animate-pulse rounded bg-neutral-200/50" />
              </div>
            ))}
          </div>
        ) : null}
        {!loading ? bars : null}
      </div>
    );
  }

  return (
    <section
      id="seu-progresso-semanal"
      className="rounded-[1.5rem] border border-neutral-200/60 bg-white/95 px-5 py-6 shadow-[0_24px_56px_-36px_rgba(15,23,42,0.2)] ring-1 ring-black/[0.03] md:px-7 md:py-7"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary">Histórico</p>
          <h2 className="mt-1 text-title18 font-semibold tracking-tight text-text-primary">Seu progresso semanal</h2>
        </div>
        <p className="text-[13px] font-semibold text-text-secondary">
          <span className="text-2xl font-bold tabular-nums text-secondary">{weekCompletedTotal}</span>
          <span className="text-text-muted"> refeições concluídas nos últimos 7 dias</span>
        </p>
      </div>
      {error ? <p className="mt-3 text-small12 font-semibold text-orange">{error}</p> : null}
      {loading ? <p className="mt-4 text-small12 font-medium text-text-muted">A carregar gráfico…</p> : null}
      {!loading ? bars : null}
    </section>
  );
}

export function PatientDashboardHero({
  firstName,
  planName,
  progressPct,
  completedCount,
  pendingCount,
  overdueCount,
  totalMeals,
  selectedDateDisplay,
  viewIsToday,
}: {
  firstName: string;
  planName: string;
  progressPct: number;
  completedCount: number;
  pendingCount: number;
  overdueCount: number;
  totalMeals: number;
  selectedDateDisplay: string;
  viewIsToday: boolean;
}) {
  const fractionLabel =
    totalMeals > 0 ? (
      <>
        {completedCount}/{totalMeals} refeições
      </>
    ) : (
      <>Sem refeições neste plano</>
    );

  return (
    <section className="touch-manipulation overflow-hidden rounded-[1.75rem] border border-emerald-200/40 bg-gradient-to-br from-white via-emerald-50/[0.35] to-white px-3 py-4 shadow-[0_32px_64px_-40px_rgba(34,110,72,0.35)] ring-1 ring-emerald-100/50 sm:px-6 sm:py-6 md:px-7">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start lg:gap-5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary">Acompanhamento</p>
          <h1 className="text-[1.5rem] font-semibold leading-tight tracking-tight text-text-primary sm:text-[1.65rem]">
            Olá, <span className="text-secondary">{firstName}</span>
          </h1>
          <p className="text-[14px] font-medium leading-snug text-text-secondary sm:text-[15px]">{planName}</p>
          <p className="pt-0.5 text-[12px] font-semibold text-text-muted sm:text-[13px]">{selectedDateDisplay}</p>
          {!viewIsToday ? (
            <p className="rounded-lg border border-amber-200/60 bg-amber-50/80 px-2.5 py-1.5 text-[11px] font-semibold text-amber-950 sm:text-[12px]">
              Dia diferente de hoje — os registos usam esta data.
            </p>
          ) : null}
        </div>

        <div className="w-full max-w-full lg:min-w-0">
          <div className="rounded-[1.2rem] border border-neutral-200/55 bg-white px-3 py-4 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.1)] ring-1 ring-black/[0.02] sm:px-4 sm:py-4 lg:px-5">
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-stretch sm:gap-4 md:gap-6">
              <div className="mx-auto flex min-w-0 w-full flex-1 flex-col items-center justify-center sm:mx-0">
                <DottedSemicircleArc progressPct={totalMeals ? progressPct : 0} />
                <div className="-mt-1 flex w-full max-w-[min(100%,28rem)] flex-col items-center text-center sm:-mt-2">
                  <p className="text-[1.75rem] font-bold leading-none tracking-tight text-text-primary sm:text-[2rem]">{progressPct}%</p>
                  <p className="mt-1 text-[12px] font-medium text-text-muted sm:text-[13px]">
                    {viewIsToday ? "Concluído hoje" : "Concluído neste dia"}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium tabular-nums text-text-muted sm:text-[12px]">{fractionLabel}</p>
                </div>
              </div>

              <div className="min-h-0 min-w-[10.5rem] shrink-0 divide-y divide-neutral-100 sm:min-w-[11.5rem] md:min-w-[12.5rem]">
                <HeroStatRow
                  compact
                  label="Concluídas"
                  value={completedCount}
                  icon={<IconCheck className="h-3.5 w-3.5 text-secondary sm:h-4 sm:w-4" />}
                  iconWrapClass="bg-emerald-100/90 text-secondary"
                />
                <HeroStatRow
                  compact
                  label="Pendentes"
                  value={pendingCount}
                  icon={<IconClock className="h-3.5 w-3.5 text-orange sm:h-4 sm:w-4" />}
                  iconWrapClass="bg-orange/[0.12] text-orange"
                />
                <HeroStatRow
                  compact
                  label="Atrasadas"
                  value={overdueCount}
                  icon={<IconAlert className="h-3.5 w-3.5 text-rose-700 sm:h-4 sm:w-4" />}
                  iconWrapClass="bg-rose-50 text-rose-700 ring-1 ring-rose-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-text-secondary sm:mt-4 sm:text-[14px]">
        {heroMessage(progressPct, overdueCount, viewIsToday)}
      </p>
    </section>
  );
}

/** Iniciais de domingo a sábado (pt-BR). */
const WEEKDAY_LETTER_PT: string[] = ["D", "S", "T", "Q", "Q", "S", "S"];

function startOfWeekSundayYmd(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  date.setDate(date.getDate() - date.getDay());
  return formatPortalYmd(date);
}

function parseYmdParts(ymd: string): { y: number; m: number; d: number } {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y: y!, m: m!, d: d! };
}

/** monthIndex0: 0 = janeiro. Preserva o dia quando possível (ex.: 31 jan → 28 fev). */
function clampDayInMonth(year: number, monthIndex0: number, desiredDay: number): string {
  const last = new Date(year, monthIndex0 + 1, 0).getDate();
  const day = Math.min(Math.max(1, desiredDay), last);
  return formatPortalYmd(new Date(year, monthIndex0, day));
}

const MONTH_LABELS_PT_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

export function PatientWeeklyProgressCard({
  patientId,
  planId,
  mealsCount,
  enabled,
}: {
  patientId: string;
  planId: string;
  mealsCount: number;
  enabled: boolean;
}) {
  return (
    <PatientWeeklyProgressChart
      patientId={patientId}
      planId={planId}
      mealsCount={mealsCount}
      enabled={enabled}
      variant="standalone"
    />
  );
}

/**
 * Faixa horizontal de dias (semana do selecionado) + filtro por mês/ano ao tocar no título.
 */
export function PatientCalendarAndPeriod({
  selectedYmd,
  onSelectYmd,
}: {
  selectedYmd: string;
  onSelectYmd: (ymd: string) => void;
}) {
  const todayYmd = todayPortalLogDate();
  const advancedPanelId = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [advancedOpen, setAdvancedOpen] = React.useState(false);

  const weekStartYmd = React.useMemo(() => startOfWeekSundayYmd(selectedYmd), [selectedYmd]);
  const weekDays = React.useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysYmd(weekStartYmd, i)), [weekStartYmd]);

  const monthTitle = React.useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(`${selectedYmd}T12:00:00`)),
    [selectedYmd],
  );

  const { y: selYear, m: selMonth, d: selDay } = React.useMemo(() => parseYmdParts(selectedYmd), [selectedYmd]);
  const yearNow = new Date().getFullYear();
  const yearOptions = React.useMemo(() => {
    const lo = Math.min(selYear, yearNow - 6);
    const hi = Math.max(selYear, yearNow + 2);
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  }, [yearNow, selYear]);

  React.useEffect(() => {
    if (!advancedOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setAdvancedOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [advancedOpen]);

  const goPrevWeek = () => onSelectYmd(addDaysYmd(selectedYmd, -7));
  const goNextWeek = () => onSelectYmd(addDaysYmd(selectedYmd, 7));

  const applyMonth = (monthIndex0: number) => {
    onSelectYmd(clampDayInMonth(selYear, monthIndex0, selDay));
  };

  const applyYear = (year: number) => {
    onSelectYmd(clampDayInMonth(year, selMonth - 1, selDay));
  };

  return (
    <div ref={rootRef} className="touch-manipulation space-y-5">
      <div className="max-w-full rounded-[1.35rem] border border-neutral-200/50 bg-white/95 px-3 py-4 shadow-[0_20px_48px_-32px_rgba(34,110,72,0.12)] ring-1 ring-emerald-100/30 sm:px-4 sm:py-5 md:px-6 md:py-5">
        <div className="mb-4 flex items-center justify-between gap-2 sm:mb-5 sm:gap-3">
          <button
            type="button"
            id={`${advancedPanelId}-trigger`}
            aria-expanded={advancedOpen}
            aria-controls={advancedPanelId}
            className="flex min-h-11 min-w-0 max-w-[min(100%,18rem)] items-center gap-2 rounded-xl py-2 text-left text-[0.95rem] font-semibold capitalize tracking-tight text-text-primary ring-offset-2 transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 sm:max-w-[min(100%,20rem)] sm:text-[1.05rem]"
            onClick={() => setAdvancedOpen((o) => !o)}
          >
            <span className="truncate">{monthTitle}</span>
            <span className="shrink-0 text-sm font-bold text-text-muted" aria-hidden>
              {advancedOpen ? "▲" : "▼"}
            </span>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Semana anterior"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-neutral-200/90 bg-white text-base font-semibold leading-none text-text-secondary shadow-sm transition-colors hover:border-secondary/35 hover:bg-emerald-50/60 sm:h-9 sm:w-9"
              onClick={goPrevWeek}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Próxima semana"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-neutral-200/90 bg-white text-base font-semibold leading-none text-text-secondary shadow-sm transition-colors hover:border-secondary/35 hover:bg-emerald-50/60 sm:h-9 sm:w-9"
              onClick={goNextWeek}
            >
              ›
            </button>
          </div>
        </div>

        {advancedOpen ? (
          <div
            id={advancedPanelId}
            role="region"
            aria-labelledby={`${advancedPanelId}-trigger`}
            className="mb-5 space-y-4 rounded-2xl border border-neutral-200/70 bg-neutral-50/50 p-4 ring-1 ring-black/[0.02]"
          >
            <div>
              <label htmlFor={`${advancedPanelId}-year`} className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Ano
              </label>
              <select
                id={`${advancedPanelId}-year`}
                value={selYear}
                onChange={(e) => applyYear(Number(e.target.value))}
                className="min-h-12 w-full rounded-xl border border-neutral-200/90 bg-white px-3 py-3 text-base font-semibold text-text-primary shadow-sm focus:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/25 sm:min-h-0 sm:py-2.5 sm:text-[15px]"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Mês</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {MONTH_LABELS_PT_SHORT.map((label, idx) => {
                  const active = selMonth === idx + 1;
                  return (
                    <button
                      key={label}
                      type="button"
                      className={cn(
                        "min-h-11 rounded-xl border px-2 py-2.5 text-[13px] font-semibold capitalize transition-colors sm:min-h-0",
                        active
                          ? "border-secondary bg-secondary/15 text-secondary ring-1 ring-secondary/20"
                          : "border-neutral-200/80 bg-white text-text-secondary hover:border-secondary/35 hover:bg-emerald-50/40",
                      )}
                      onClick={() => applyMonth(idx)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            {selectedYmd !== todayYmd ? (
              <button
                type="button"
                className="min-h-11 w-full rounded-xl border border-neutral-200/80 bg-white py-2.5 text-[13px] font-semibold text-secondary transition-colors hover:bg-emerald-50/60"
                onClick={() => {
                  onSelectYmd(todayYmd);
                  setAdvancedOpen(false);
                }}
              >
                Ir para hoje
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="grid min-w-0 grid-cols-7 gap-0.5 sm:gap-2" role="tablist" aria-label="Dias da semana">
          {weekDays.map((ymd) => {
            const d = new Date(`${ymd}T12:00:00`);
            const wi = d.getDay();
            const letter = WEEKDAY_LETTER_PT[wi] ?? "";
            const dayNum = String(d.getDate()).padStart(2, "0");
            const isSelected = ymd === selectedYmd;
            const isToday = ymd === todayYmd;
            return (
              <button
                key={ymd}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectYmd(ymd)}
                className={cn(
                  "flex flex-col items-center justify-center py-0.5 transition-all duration-200 sm:py-1",
                  !isSelected && "rounded-2xl hover:bg-neutral-50/90 active:bg-neutral-100/80",
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-10 max-w-[2.75rem] shrink-0 select-none flex-col items-center justify-center gap-0.5 rounded-full transition-all duration-200 sm:h-11 sm:w-11",
                    isSelected &&
                      "bg-secondary text-white shadow-[0_8px_22px_-6px_rgba(34,110,72,0.45)] ring-2 ring-secondary/25",
                    !isSelected &&
                      isToday &&
                      "bg-emerald-100/85 text-secondary ring-1 ring-secondary/30",
                    !isSelected && !isToday && "bg-transparent",
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase leading-none tracking-wide",
                      isSelected ? "text-white" : isToday ? "text-secondary" : "text-text-muted",
                    )}
                  >
                    {letter}
                  </span>
                  <span
                    className={cn(
                      "text-[13px] font-bold tabular-nums leading-none",
                      isSelected ? "text-white" : isToday ? "text-secondary" : "text-text-primary",
                    )}
                  >
                    {dayNum}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-center text-[11px] font-medium text-text-muted">
          Toque no mês e no ano para escolher outro período; abaixo, selecione o dia na semana.
        </p>
      </div>
    </div>
  );
}
