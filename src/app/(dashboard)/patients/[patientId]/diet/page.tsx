import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { MealCard, type MenuMeta, type MealMacros, type DifficultyLabel } from "@/components/ui/meal-card";
import { PageHeader } from "@/components/layout/dashboard/page-header";

function MacroStatCard({
  label,
  value,
  accent = "bg-orange",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <Card className="rounded-2xl border border-neutral-200/80 bg-bg-0 p-4 shadow-soft">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-small12 font-semibold text-text-secondary">{label}</p>
        <p className="text-body16Semi font-extrabold text-text-primary">{value}</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-neutral-100">
        <div className={`h-2 rounded-full ${accent}`} style={{ width: "80%" }} />
      </div>
    </Card>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-title16 font-extrabold text-text-primary">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

const FEATURED_MACROS: MealMacros = { calories: 450, carbsG: 40, proteinG: 35, fatsG: 12 };

const featuredMeal = {
  title: "Peito de frango grelhado com aspargos e arroz integral",
  categoryLabel: "Almoço",
  categoryTone: "primary" as const,
  difficultyLabel: "médio" as DifficultyLabel,
  macros: FEATURED_MACROS,
  meta: {
    ratingText: "4,8/5",
    reviewCountText: "(125 avaliações)",
    durationText: "10 minutos",
    stepsText: "4 passos",
    macroIntensity: 0.78,
  } satisfies MenuMeta,
} as const;

const filterTabs = [
  { key: "all", label: "Todos" },
  { key: "breakfast", label: "Café da manhã" },
  { key: "lunch", label: "Almoço" },
  { key: "snack", label: "Lanche" },
  { key: "dinner", label: "Jantar" },
] as const;

const menuItems = [
  {
    title: "Torrada integral com abacate e ovo",
    categoryLabel: "Café da manhã",
    categoryTone: "secondary" as const,
    difficultyLabel: "fácil" as DifficultyLabel,
    macros: { calories: 320, carbsG: 28, proteinG: 18, fatsG: 12 },
    meta: { macroIntensity: 0.52 },
  },
  {
    title: "Tacos de camarão com molho de manga",
    categoryLabel: "Almoço",
    categoryTone: "primary" as const,
    difficultyLabel: "médio" as DifficultyLabel,
    macros: { calories: 520, carbsG: 52, proteinG: 28, fatsG: 14 },
    meta: { macroIntensity: 0.7 },
  },
  {
    title: "Salada de grãos com frango e folhas verdes",
    categoryLabel: "Almoço",
    categoryTone: "primary" as const,
    difficultyLabel: "médio" as DifficultyLabel,
    macros: { calories: 480, carbsG: 46, proteinG: 30, fatsG: 16 },
    meta: { macroIntensity: 0.66 },
  },
  {
    title: "Iogurte proteico com frutas e granola",
    categoryLabel: "Lanche",
    categoryTone: "orange" as const,
    difficultyLabel: "fácil" as DifficultyLabel,
    macros: { calories: 240, carbsG: 22, proteinG: 25, fatsG: 6 },
    meta: { macroIntensity: 0.44 },
  },
  {
    title: "Smoothie de frutas com proteína",
    categoryLabel: "Lanche",
    categoryTone: "orange" as const,
    difficultyLabel: "fácil" as DifficultyLabel,
    macros: { calories: 210, carbsG: 20, proteinG: 22, fatsG: 5 },
    meta: { macroIntensity: 0.38 },
  },
  {
    title: "Frango assado com quinoa e kale",
    categoryLabel: "Jantar",
    categoryTone: "yellow" as const,
    difficultyLabel: "médio" as DifficultyLabel,
    macros: { calories: 610, carbsG: 48, proteinG: 44, fatsG: 16 },
    meta: { macroIntensity: 0.82 },
  },
  {
    title: "Salmão com legumes assados",
    categoryLabel: "Jantar",
    categoryTone: "yellow" as const,
    difficultyLabel: "médio" as DifficultyLabel,
    macros: { calories: 590, carbsG: 34, proteinG: 42, fatsG: 28 },
    meta: { macroIntensity: 0.74 },
  },
  {
    title: "Omelete de claras com espinafre",
    categoryLabel: "Café da manhã",
    categoryTone: "secondary" as const,
    difficultyLabel: "fácil" as DifficultyLabel,
    macros: { calories: 280, carbsG: 14, proteinG: 28, fatsG: 10 },
    meta: { macroIntensity: 0.5 },
  },
] satisfies Array<{
  title: string;
  categoryLabel: string;
  categoryTone: "primary" | "secondary" | "yellow" | "orange";
  difficultyLabel: DifficultyLabel;
  macros: MealMacros;
  meta: Pick<MenuMeta, "macroIntensity">;
}>;

const popularItems = [menuItems[1], menuItems[5], menuItems[3]] as const;
const recommendedItems = [menuItems[0], menuItems[4], menuItems[6]] as const;

export default function PatientDietView({ params }: { params: { patientId: string } }) {
  void params;

  return (
    <div className="space-y-8 pb-4">
      <PageHeader
        eyebrow="Cardápio"
        title="Refeições e categorias"
        description="Prato em destaque, macronutrientes e listas por momento do dia — pronto para associar ao plano do paciente."
      />

      {/* Prato em destaque */}
      <MealCard layout="featured" {...featuredMeal} imageSlot={null} ctaLabel="Adicionar ao plano" />

      {/* Macronutrients */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MacroStatCard label="Calorias" value={`${FEATURED_MACROS.calories ?? 0} kcal`} accent="bg-orange" />
        <MacroStatCard label="Carboidratos" value={`${FEATURED_MACROS.carbsG ?? 0} g`} accent="bg-yellow" />
        <MacroStatCard label="Proteínas" value={`${FEATURED_MACROS.proteinG ?? 0} g`} accent="bg-primary" />
        <MacroStatCard label="Gorduras" value={`${FEATURED_MACROS.fatsG ?? 0} g`} accent="bg-orange/80" />
      </div>

      {/* Menu completo */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {filterTabs.map((t) => {
            const active = t.key === "all";
            return (
              <span
                // eslint-disable-next-line react/no-array-index-key
                key={t.key}
                className={
                  active
                    ? "inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary border border-primary/20"
                    : "inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-text-secondary border border-neutral-200"
                }
              >
                {t.label}
              </span>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {menuItems.slice(0, 8).map((m) => (
            <MealCard key={m.title} layout="menu" {...m} imageSlot={null} ctaLabel="Adicionar ao plano" />
          ))}
        </div>
      </div>

      {/* Mais populares */}
      <Section title="Mais populares">
        <div className="grid gap-3 sm:grid-cols-2">
          {popularItems.map((m) => (
            <MealCard key={m.title} layout="menu" {...m} imageSlot={null} ctaLabel="Adicionar ao plano" />
          ))}
        </div>
      </Section>

      {/* Recomendados */}
      <Section title="Recomendados">
        <div className="grid gap-3 sm:grid-cols-2">
          {recommendedItems.map((m) => (
            <MealCard key={m.title} layout="menu" {...m} imageSlot={null} ctaLabel="Adicionar ao plano" />
          ))}
        </div>
      </Section>
    </div>
  );
}

