import * as React from "react";
import type { DraftPatient, DraftPlan } from "@/lib/draft-storage";
import {
  buildRecipesFromPlan,
  buildShoppingListFromPlan,
  mealMacroSummary,
  patientSummary,
  sectionFlagsForVariant,
  type PlanPdfVariant,
} from "@/lib/pdf/plan-pdf-model";
import type { ShoppingListItem } from "@/lib/clinical/shopping-list";

function nowPtBr() {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date());
}

function variantLabel(variant: PlanPdfVariant): string {
  if (variant === "diet") return "Versão: Somente dieta";
  if (variant === "shopping") return "Versão: Lista de compras";
  if (variant === "recipes") return "Versão: Receitas";
  return "Versão: Plano completo";
}

function sectionTitleForVariant(variant: PlanPdfVariant): string {
  if (variant === "diet") return "Plano alimentar";
  if (variant === "shopping") return "Lista de compras";
  if (variant === "recipes") return "Receitas";
  return "Plano alimentar completo";
}

function professionalLabel(plan: DraftPlan): string {
  return plan.professionalName || "Profissional de nutrição";
}

export function PlanPdfDocument({
  plan,
  patient,
  variant,
  shoppingOverride,
}: {
  plan: DraftPlan;
  patient: DraftPatient | null;
  variant: PlanPdfVariant;
  shoppingOverride?: ShoppingListItem[] | null;
}) {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const [totalPagesEstimate, setTotalPagesEstimate] = React.useState(1);
  const flags = sectionFlagsForVariant(variant);
  const pSummary = patientSummary(patient, plan);
  const patientHeaderValue = pSummary.find((x) => x.label === "Paciente")?.value ?? "Não informado";
  const shopping = shoppingOverride && shoppingOverride.length > 0 ? shoppingOverride : buildShoppingListFromPlan(plan);
  const recipes = buildRecipesFromPlan(plan);
  const macroMap = new Map(mealMacroSummary(plan).map((x) => [x.mealId, x]));
  React.useEffect(() => {
    const calc = () => {
      const el = rootRef.current;
      if (!el) return;
      const height = el.scrollHeight;
      const pagePx = 1040;
      const total = Math.max(1, Math.ceil(height / pagePx));
      setTotalPagesEstimate(total);
    };
    calc();
    const id = window.setTimeout(calc, 240);
    window.addEventListener("resize", calc);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", calc);
    };
  }, [plan.id, plan.currentVersionNumber, variant, plan.meals.length, plan.description]);

  return (
    <article ref={rootRef} className="pdf-doc relative mx-auto w-full max-w-[860px] bg-white px-12 py-16 text-[13px] leading-[1.7] text-[#1f2937]">
      <div className="pdf-watermark" aria-hidden>
        <img src="/images/nutrik-logo.png" alt="" className="pdf-watermark-image" />
      </div>
      <header className="pdf-avoid-break relative z-10 border-b-2 border-[#cfe3db] pb-9">
        <div className="mb-5 h-[5px] w-32 rounded-full bg-[#16a085]" />
        <div className="flex items-start justify-between gap-8">
          <div className="min-w-0">
            <img src="/images/nutrik-logo.png" alt="Nutrik" className="h-12 w-auto object-contain" />
            <div className="mt-7 space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0f766e]">Material clínico personalizado</p>
              <h1 className="text-[25px] font-extrabold leading-[1.06] text-[#0b1220]">{sectionTitleForVariant(variant)}</h1>
              <p className="text-[14px] leading-[1.7] text-[#334155]">{plan.name.trim() || "Plano sem nome"}</p>
              <p className="text-[12px] font-medium text-[#64748b]">{variantLabel(variant)}</p>
            </div>
          </div>
          <div className="min-w-[320px] rounded-xl border border-[#dbe7e2] bg-[#fbfefd] px-5 py-4 text-[12px] leading-[1.75] text-[#4b5563]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Profissional responsável</p>
            <p className="mt-1.5 text-[14px] font-bold text-[#0f172a]">{professionalLabel(plan)}</p>
            {plan.professionalRegistration ? <p>{plan.professionalRegistration}</p> : null}
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-[#e6f0ec] pt-3">
              <p className="text-[11px] uppercase tracking-[0.07em] text-[#64748b]">Paciente</p>
              <p className="text-right text-[12px] font-semibold text-[#334155]">{patientHeaderValue}</p>
              <p className="text-[11px] uppercase tracking-[0.07em] text-[#64748b]">Revisão</p>
              <p className="text-right text-[12px] font-semibold text-[#334155]">v{plan.currentVersionNumber || 1}</p>
              <p className="text-[11px] uppercase tracking-[0.07em] text-[#64748b]">Emissão</p>
              <p className="text-right text-[12px] font-semibold text-[#334155]">{nowPtBr()}</p>
            </div>
          </div>
        </div>
      </header>

      {flags.showPatientSummary ? (
        <section className="pdf-avoid-break relative z-10 mt-14">
          <h2 className="pdf-heading pdf-keep-with-next text-[20px] font-extrabold tracking-[0.01em] text-[#0f172a]">Resumo do paciente</h2>
          <div className="mt-5 grid grid-cols-2 gap-x-12 gap-y-3 text-[13px]">
            {pSummary.map((x) => (
              <div key={x.label} className="flex items-baseline gap-3 border-b border-[#eef1f4] pb-2">
                <p className="min-w-[86px] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">{x.label}</p>
                <p className="text-[14px] font-medium text-[#0f172a]">{x.value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {flags.showDiet ? (
        <section className="pdf-block-shell pdf-block-diet relative z-10 mt-[3.3rem] px-5 pt-4 pb-7">
          <h2 className="pdf-heading pdf-keep-with-next pdf-section-title text-[22px] font-black tracking-[0.01em] text-[#0b1322]">Plano alimentar</h2>
          <div className="pdf-meals-list mt-[1.35rem] space-y-11">
            {plan.meals.map((meal, idx) => {
              const mm = macroMap.get(meal.id);
              return (
                <section key={meal.id} className="pdf-meal-block pdf-avoid-break border-t border-[#e4ebf0] pt-[0.9rem]">
                  <div className="pdf-meal-head flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#536579]">Refeição {idx + 1}</p>
                      <p className="mt-1 text-[20px] font-black leading-tight text-[#0b1322]">{meal.name || "Refeição"}</p>
                    </div>
                    <p className="shrink-0 text-[13px] font-semibold tracking-[0.03em] text-[#1f2937]">{meal.time || "Sem horário definido"}</p>
                  </div>
                  <div className="pdf-meal-groups mt-[0.8rem] space-y-[0.85rem]">
                    {meal.groups.map((group) => (
                      <div key={group.id} className="pdf-meal-group">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#4f6479]">{group.name}</p>
                        <ul className="mt-1.5 space-y-1 text-[13px] leading-[1.6] text-[#334155]">
                          {group.options.map((opt) => (
                            <li key={opt.id}>
                              <span className="font-semibold text-[#0f172a]">{opt.name || "Item"}</span>{" "}
                              <span>— {opt.quantity > 0 ? `${opt.quantity} ${opt.unit}` : opt.householdMeasure || "porção orientada pela nutricionista"}</span>
                              {opt.householdMeasure ? <span className="text-[#64748b]"> ({opt.householdMeasure})</span> : null}
                              {opt.note ? <p className="mt-1 text-[12px] leading-relaxed text-[#64748b]">{opt.note}</p> : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  {meal.observation ? (
                    <p className="mt-3 border-l-2 border-[#dbe3ea] pl-3 text-[13px] leading-[1.65] text-[#475569]">{meal.observation}</p>
                  ) : null}
                  {mm && (mm.kcal > 0 || mm.protein > 0 || mm.carbs > 0 || mm.fat > 0) ? (
                    <p className="mt-3 text-[12px] font-semibold text-[#475569]">
                      {mm.kcal} kcal · P {Math.round(mm.protein)}g · C {Math.round(mm.carbs)}g · G {Math.round(mm.fat)}g
                    </p>
                  ) : null}
                </section>
              );
            })}
          </div>
        </section>
      ) : null}

      {flags.showGeneralNotes && plan.description.trim() ? (
        <section className="pdf-avoid-break relative z-10 mt-11">
          <h2 className="pdf-heading pdf-keep-with-next pdf-section-title text-[19px] font-extrabold tracking-[0.01em] text-[#0f172a]">Observações gerais</h2>
          <p className="mt-2.5 whitespace-pre-wrap text-[13px] leading-[1.7] text-[#4b5563]">{plan.description.trim()}</p>
        </section>
      ) : null}

      {flags.showShopping ? (
        <section className="pdf-block-shell pdf-block-shopping relative z-10 mt-6 px-5 py-4">
          <h2 className="pdf-heading pdf-keep-with-next pdf-section-title text-[19px] font-black tracking-[0.01em] text-[#0b1322]">Sugestão de compras</h2>
          {shopping.length === 0 ? (
            <p className="mt-3 text-[13px] leading-[1.7] text-[#6b7280]">Nenhum item suficiente para gerar a lista de compras neste plano.</p>
          ) : (
            <div className="mt-3.5 space-y-4">
              {[...new Set(shopping.map((x) => x.category))].map((cat) => (
                <section key={cat} className="pdf-avoid-break">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#0f766e]">{cat}</p>
                  <ul className="mt-2 space-y-1.5 text-[13px] leading-[1.6]">
                    {shopping
                      .filter((x) => x.category === cat)
                      .map((x) => (
                        <li key={`${cat}-${x.name}`} className="text-[#374151]">
                          <span className="font-semibold text-[#111827]">{x.name}</span> — {x.quantityLabel}
                        </li>
                      ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
          {flags.showRecipes && recipes.length === 0 ? (
            <div className="mt-4 border-t border-[#e5e7eb] pt-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Receitas</p>
              <p className="mt-1.5 text-[13px] leading-[1.62] text-[#6b7280]">Sem receitas vinculadas ao plano no momento.</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {flags.showRecipes && recipes.length > 0 && flags.showShopping ? (
        <div className="pdf-hard-page-break html2pdf__page-break" aria-hidden />
      ) : null}

      {flags.showRecipes && recipes.length > 0 ? (
        <section className="pdf-block-shell pdf-block-recipes pdf-section-recipes relative z-10 mt-2 px-5 py-3.5">
          <h2 className="pdf-heading pdf-keep-with-next pdf-section-title text-[21px] font-black tracking-[0.01em] text-[#0b1322]">Receitas</h2>
          <div className="mt-2.5 space-y-3.5">
            {recipes.map((r, i) => (
              <article key={`${r.title}-${i}`} className="pdf-recipe-block pdf-avoid-break border-t border-[#e8edf2] pt-2">
                <p className="text-[17px] font-bold leading-tight text-[#111827]">{r.title}</p>
                <p className="mt-1 text-[12px] text-[#64748b]">Refeição: {r.sourceMealName}</p>
                {r.imageUrl ? (
                  <div className="mt-2.5">
                    <img
                      src={r.imageUrl}
                      alt={`Imagem da receita ${r.title}`}
                      className="max-h-[180px] w-auto max-w-full rounded-lg border border-[#e5e7eb] object-contain"
                      crossOrigin="anonymous"
                    />
                  </div>
                ) : null}
                <div className="mt-2.5 grid gap-4 md:grid-cols-2">
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#64748b]">Ingredientes</p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13px] leading-[1.58] text-[#334155]">
                      {r.ingredients.map((ing, idx) => (
                        <li key={`${r.title}-ing-${idx}`}>{ing}</li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#64748b]">Modo de preparo</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-[1.62] text-[#334155]">{r.preparation}</p>
                  </section>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="pdf-footer relative z-10 mt-8 border-t border-[#e5e7eb] pt-3 text-[11px] text-[#6b7280]">
        <div className="flex items-center justify-between gap-2">
          <p>Nutrik · Material clínico · {professionalLabel(plan)}</p>
          <p className="pdf-page-counter" data-total-pages={String(totalPagesEstimate)} aria-label={`Página de ${totalPagesEstimate}`}>
            <span className="pdf-page-counter-screen">Página 1 de {totalPagesEstimate}</span>
          </p>
        </div>
      </footer>
    </article>
  );
}

