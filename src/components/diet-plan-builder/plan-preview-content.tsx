import type { DraftPlan } from "@/lib/draft-storage";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

/** Layout pensado para leitura clínica e futura geração de PDF. */
export function PlanPreviewContent({
  plan,
  className,
  patientDisplayName,
}: {
  plan: DraftPlan;
  className?: string;
  /** Nome final para cabeçalho (paciente vinculado ou rótulo manual). */
  patientDisplayName: string;
}) {
  const kindLabel = plan.planKind === "patient_plan" ? "Plano individualizado" : "Plano modelo";

  return (
    <div data-print-plan="true" className={cn("space-y-8 text-text-primary", className)}>
      {/* Bloco cabeçalho — espelha futuro PDF */}
      <header className="space-y-4 border-b-2 border-neutral-200 pb-6 print:border-black">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted print:text-neutral-600">Plano alimentar</p>
            <h3 className="mt-1 text-h3 tracking-tight print:text-2xl">{plan.name.trim() || "Plano sem nome"}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip tone={plan.status === "published" ? "success" : "yellow"}>
                {plan.status === "published" ? "Publicado" : "Rascunho"}
              </Chip>
              <Chip tone="muted">{kindLabel}</Chip>
              <Chip tone="primary">Versão {plan.currentVersionNumber}</Chip>
            </div>
          </div>
          <div className="text-right text-small12 font-semibold text-text-secondary print:text-neutral-800">
            {plan.professionalName.trim() ? (
              <>
                <p className="font-semibold text-text-primary print:text-black">{plan.professionalName}</p>
                {plan.professionalRegistration.trim() ? <p className="mt-0.5">{plan.professionalRegistration}</p> : null}
              </>
            ) : (
              <p className="text-text-muted">Profissional (preencher no plano)</p>
            )}
          </div>
        </div>

        <div className="grid gap-3 rounded-xl bg-neutral-50/80 p-4 ring-1 ring-neutral-200/80 print:bg-white print:ring-black/20 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Paciente</p>
            <p className="mt-1 text-body16Semi text-text-primary print:text-black">
              {patientDisplayName.trim() || "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Documento</p>
            <p className="mt-1 text-small12 text-text-secondary">
              {plan.meals.length} refeição(ões) · {plan.meals.reduce((acc, m) => acc + m.groups.length, 0)} grupos
            </p>
          </div>
        </div>

        {plan.description.trim() ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Descrição clínica</p>
            <p className="mt-2 whitespace-pre-wrap text-body14 leading-relaxed text-text-secondary print:text-neutral-900">
              {plan.description.trim()}
            </p>
          </div>
        ) : null}
      </header>

      <div className="space-y-10">
        {plan.meals.map((meal, i) => (
          <section
            key={meal.id}
            className="break-inside-avoid rounded-2xl border border-neutral-200/80 bg-bg-0 p-5 shadow-sm print:break-inside-avoid print:border-neutral-400"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-100 pb-3">
              <h4 className="text-title18 font-semibold text-text-primary print:text-black">
                <span className="text-primary print:text-neutral-900">{i + 1}.</span> {meal.name.trim() || "Refeição"}
              </h4>
              <span className="rounded-full bg-primary/12 px-3 py-1 text-small12 font-semibold text-text-primary ring-1 ring-primary/20 print:border print:border-neutral-400 print:bg-white">
                {meal.time || "—"}
              </span>
            </div>
            {meal.observation.trim() ? (
              <p className="mt-3 rounded-lg bg-yellow/10 px-3 py-2 text-small12 font-semibold leading-relaxed text-text-secondary print:bg-neutral-100">
                <span className="font-semibold text-text-primary">Obs. da refeição: </span>
                {meal.observation.trim()}
              </p>
            ) : null}

            <div className="mt-5 space-y-6">
              {meal.groups.map((group) => (
                <div key={group.id}>
                  <p className="text-body14Semi font-semibold uppercase tracking-wide text-secondary print:text-black">{group.name}</p>
                  <ul className="mt-2 space-y-4 border-l-2 border-primary/30 pl-4">
                    {group.options.map((opt) => (
                      <li key={opt.id} className="text-body14">
                        <div className="font-semibold text-text-primary print:text-black">
                          {opt.name.trim() || "—"}
                          {(opt.quantity > 0 || opt.unit) && (
                            <span className="ml-1 font-bold text-secondary print:text-neutral-800">
                              {" "}
                              — {opt.quantity > 0 ? opt.quantity : "—"} {opt.unit}
                            </span>
                          )}
                          {opt.householdMeasure.trim() ? (
                            <span className="mt-0.5 block text-small12 font-medium text-text-muted print:text-neutral-700">
                              Medida caseira: {opt.householdMeasure}
                            </span>
                          ) : null}
                          {(opt.grams > 0 || opt.ml > 0) && (
                            <span className="mt-0.5 block text-[11px] font-semibold text-text-muted print:text-neutral-600">
                              {opt.grams > 0 ? `≈ ${opt.grams} g` : ""}
                              {opt.grams > 0 && opt.ml > 0 ? " · " : ""}
                              {opt.ml > 0 ? `≈ ${opt.ml} ml` : ""}
                            </span>
                          )}
                        </div>
                        {opt.note.trim() ? (
                          <p className="mt-1 text-small12 text-text-secondary print:text-neutral-800">{opt.note}</p>
                        ) : null}
                        {opt.recipe.trim() ? (
                          <div className="mt-2 rounded-lg bg-neutral-50/90 p-3 text-small12 leading-relaxed text-text-secondary print:border print:border-neutral-300 print:bg-white">
                            <span className="font-semibold text-text-primary print:text-black">Preparo: </span>
                            {opt.recipe.trim()}
                          </div>
                        ) : null}
                        {opt.imageUrl.trim() ? (
                          <div className="mt-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={opt.imageUrl}
                              alt={opt.name || "Ilustração"}
                              className="max-h-36 max-w-full rounded-lg border border-neutral-200 object-contain print:max-h-48"
                            />
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
