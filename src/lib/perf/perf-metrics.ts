"use client";

export type PerfMetric = {
  key: string;
  durationMs: number;
  atIso: string;
  detail?: string;
};

const MAX_METRICS = 250;

function readStore(): PerfMetric[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("nutrik:perf:metrics");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PerfMetric[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(metrics: PerfMetric[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("nutrik:perf:metrics", JSON.stringify(metrics.slice(-MAX_METRICS)));
}

export function recordPerfMetric(key: string, durationMs: number, detail?: string) {
  if (typeof window === "undefined") return;
  const next: PerfMetric = {
    key,
    durationMs: Math.round(durationMs * 100) / 100,
    atIso: new Date().toISOString(),
    detail,
  };
  const list = readStore();
  list.push(next);
  writeStore(list);
}

export function measurePerf<T>(key: string, run: () => PromiseLike<T> | T, detail?: string): Promise<T> {
  const start = typeof performance !== "undefined" ? performance.now() : Date.now();
  return Promise.resolve(run()).finally(() => {
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    recordPerfMetric(key, end - start, detail);
  });
}

export function getPerfSummary(): Array<{ key: string; count: number; avgMs: number; p95Ms: number }> {
  const byKey = new Map<string, number[]>();
  for (const m of readStore()) {
    const arr = byKey.get(m.key) ?? [];
    arr.push(m.durationMs);
    byKey.set(m.key, arr);
  }
  return [...byKey.entries()].map(([key, vals]) => {
    const sorted = [...vals].sort((a, b) => a - b);
    const avg = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
    return {
      key,
      count: vals.length,
      avgMs: Math.round(avg * 100) / 100,
      p95Ms: Math.round(p95 * 100) / 100,
    };
  });
}

export function getRecentPerfMetrics(limit = 100): PerfMetric[] {
  return readStore().slice(-Math.max(1, limit));
}

export function clearPerfMetrics(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("nutrik:perf:metrics");
}

