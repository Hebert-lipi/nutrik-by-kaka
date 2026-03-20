import * as React from "react";
import { cn } from "@/lib/utils";
import { Pill } from "./pill";
import { Button } from "./button";

export type DifficultyLabel = "fácil" | "médio";

export type MealLayout = "featured" | "menu";

export type MealMacros = {
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatsG?: number;
};

export type MenuMeta = {
  ratingText?: string; // "4,8/5"
  reviewCountText?: string; // "125 avaliações"
  durationText?: string; // "10 minutos"
  stepsText?: string; // "4 passos"
  macroIntensity?: number; // 0..1 (menu cards visual hint)
};

type MealCategoryTone = "primary" | "secondary" | "yellow" | "orange" | "neutral";

export function MealCard({
  layout = "menu",
  title,
  macros,
  className,
  imageSlot,
  categoryLabel,
  categoryTone = "primary",
  difficultyLabel,
  ctaLabel = "Adicionar ao plano",
  meta,
  classNameImage,
}: {
  layout?: MealLayout;
  title: string;
  macros?: MealMacros;
  className?: string;
  imageSlot?: React.ReactNode;
  categoryLabel?: string;
  categoryTone?: MealCategoryTone;
  difficultyLabel?: DifficultyLabel;
  ctaLabel?: string;
  meta?: MenuMeta;
  classNameImage?: string;
}) {
  const intensity = Math.min(1, Math.max(0, meta?.macroIntensity ?? 0.65));
  const bars = Array.from({ length: 10 }, (_, i) => i);
  const filledCount = Math.round(intensity * bars.length);

  if (layout === "featured") {
    return (
      <article className={cn("rounded-xl border border-neutral-200 bg-bg-0 shadow-soft", className)}>
        <div className="flex flex-col gap-4 p-4 sm:flex-row">
          <div
            className={cn(
              "relative h-[180px] w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 sm:h-[160px] sm:w-[240px] sm:flex-shrink-0",
              classNameImage ?? "",
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-50" />
            {imageSlot ? (
              <div className="absolute inset-0 flex items-center justify-center">{imageSlot}</div>
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {categoryLabel ? <Pill tone={categoryTone}>{categoryLabel}</Pill> : null}
                  {difficultyLabel ? (
                    <Pill tone="neutral" className="bg-neutral-100">
                      {difficultyLabel}
                    </Pill>
                  ) : null}
                </div>

                <h2 className="mt-2 line-clamp-2 text-body16Semi font-extrabold text-text-primary">{title}</h2>

                {meta?.ratingText ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-small12 text-text-secondary">
                    <span className="inline-flex items-center gap-1 font-semibold text-text-primary">
                      <StarIcon />
                      {meta.ratingText}
                    </span>
                    {meta.reviewCountText ? <span className="text-neutral-600">{meta.reviewCountText}</span> : null}
                  </div>
                ) : null}
              </div>

              <div className="hidden sm:flex items-center gap-1" aria-label="Macro intensidade">
                {bars.map((i) => (
                  <span
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    className={cn("h-[7px] w-[6px] rounded-sm", i < filledCount ? "bg-orange" : "bg-neutral-200")}
                  />
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-small12 text-neutral-600">
              {meta?.durationText ? (
                <span className="inline-flex items-center gap-1">
                  <ClockIcon />
                  {meta.durationText}
                </span>
              ) : null}
              {meta?.stepsText ? (
                <span className="inline-flex items-center gap-1">
                  <StepsIcon />
                  {meta.stepsText}
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-start sm:justify-end">
              <Button size="md" className="w-full rounded-xl sm:min-w-[220px]">
                <PlusIcon />
                {ctaLabel}
              </Button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("rounded-xl border border-neutral-200 bg-bg-0 shadow-soft", className)}>
      <div className="flex gap-3 p-3">
        <div className="relative h-[72px] w-[96px] flex-shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-50" />
          {imageSlot ? <div className="absolute inset-0 flex items-center justify-center">{imageSlot}</div> : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-body14 font-extrabold text-text-primary line-clamp-2">{title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {categoryLabel ? <Pill tone={categoryTone}>{categoryLabel}</Pill> : null}
                {difficultyLabel ? <Pill tone="neutral">{difficultyLabel}</Pill> : null}
              </div>
            </div>

            <div className="flex items-center gap-1 self-start" aria-label="Macro intensidade">
              {bars.map((i) => (
                <span
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  className={cn("h-[6px] w-[6px] rounded-sm", i < filledCount ? "bg-orange" : "bg-neutral-200")}
                />
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-small12 text-neutral-600">
            {typeof macros?.calories === "number" ? (
              <span className="inline-flex items-baseline gap-1">
                <span className="font-semibold text-text-primary">{macros.calories}</span> kcal
              </span>
            ) : null}
            {typeof macros?.carbsG === "number" ? (
              <span className="inline-flex items-baseline gap-1">
                <span className="font-semibold text-text-primary">{macros.carbsG}</span>g carboidratos
              </span>
            ) : null}
            {typeof macros?.proteinG === "number" ? (
              <span className="inline-flex items-baseline gap-1">
                <span className="font-semibold text-text-primary">{macros.proteinG}</span>g proteínas
              </span>
            ) : null}
            {typeof macros?.fatsG === "number" ? (
              <span className="inline-flex items-baseline gap-1">
                <span className="font-semibold text-text-primary">{macros.fatsG}</span>g gorduras
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-end">
            <Button size="sm" className="rounded-xl">
              <PlusIcon />
              {ctaLabel}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 2.7l2.3 5.6 6.1.5-4.7 3.9 1.5 5.9L10 15.9 3.8 18.6 5.3 12.7 0.6 8.8l6.1-.5L10 2.7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10 17.2a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6.3v4l2.7 1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function StepsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3.6 6.6h12.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3.6 10h12.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3.6 13.4h8.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10 4.5v11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4.5 10h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

