"use client";

import * as React from "react";
import { searchFoodsByName, type FoodRow } from "@/lib/supabase/foods";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  label: string;
  value: string;
  onValueChange: (name: string) => void;
  foodLinked: boolean;
  onSelectFood: (food: FoodRow) => void;
  onClearFood: () => void;
  disabled?: boolean;
  className?: string;
};

const DEBOUNCE_MS = 280;

export function FoodAutocomplete({
  id,
  label,
  value,
  onValueChange,
  foodLinked,
  onSelectFood,
  onClearFood,
  disabled,
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<FoodRow[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const runSearch = React.useCallback(async (q: string) => {
    setLoading(true);
    setErr(null);
    try {
      const rows = await searchFoodsByName(q, 24);
      setResults(rows);
    } catch (e) {
      setResults([]);
      setErr(e instanceof Error ? e.message : "Erro ao buscar alimentos.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(value);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, open, runSearch]);

  return (
    <div ref={wrapRef} className={cn("relative space-y-1.5", className)}>
      <div className="flex items-end justify-between gap-2">
        <label htmlFor={id} className="block text-small12 font-bold uppercase tracking-wide text-text-muted">
          {label}
        </label>
        {foodLinked ? (
          <button
            type="button"
            className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-orange hover:bg-orange/10"
            onClick={() => {
              onClearFood();
              setOpen(false);
            }}
          >
            Limpar base
          </button>
        ) : null}
      </div>
      <div className="relative">
        <input
          id={id}
          type="text"
          disabled={disabled}
          autoComplete="off"
          placeholder="Digite para buscar na base ou preencha livremente"
          className="h-11 w-full rounded-xl border border-neutral-200/90 bg-bg-0 px-4 text-sm font-semibold text-text-primary shadow-sm outline-none transition-all placeholder:text-neutral-400 focus:border-primary/30 focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {foodLinked ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary">
            Base
          </span>
        ) : null}
        {open ? (
          <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-56 overflow-auto rounded-xl border border-neutral-200/90 bg-bg-0 py-1 shadow-premium-sm ring-1 ring-black/[0.04]">
            {loading ? (
              <p className="px-3 py-2.5 text-small12 font-semibold text-text-muted">Buscando…</p>
            ) : err ? (
              <p className="px-3 py-2.5 text-small12 font-bold text-orange">{err}</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-2.5 text-small12 font-semibold text-text-muted">Nenhum resultado.</p>
            ) : (
              results.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-primary/[0.06]"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSelectFood(f);
                    setOpen(false);
                  }}
                >
                  <span className="font-semibold text-text-primary">{f.name}</span>
                  <span className="text-[11px] font-semibold text-text-muted">
                    {Math.round(f.calories)} kcal / {f.unit} · P {f.protein}g · C {f.carbs}g · G {f.fat}g
                  </span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
      <p className="text-[10px] font-semibold leading-snug text-text-muted">
        Referência nutricional da base: valores por <span className="font-bold">100 g</span> (ajuste quantidade e g/ml para calcular a porção).
      </p>
    </div>
  );
}
