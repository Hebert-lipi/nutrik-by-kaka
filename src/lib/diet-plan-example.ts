import type { DraftPlanFood, DraftPlanMeal } from "@/lib/draft-storage";

/** Dieta de exemplo para preencher o construtor (IDs novos a cada uso). */
export function getExampleMeals(): DraftPlanMeal[] {
  const mk = (name: string, rows: Omit<DraftPlanFood, "id">[]) => ({
    id: crypto.randomUUID(),
    name,
    items: rows.map((r) => ({ ...r, id: crypto.randomUUID() })),
  });

  return [
    mk("Café da manhã", [
      { name: "Aveia em flocos", quantity: 40, unit: "g", note: "Cozida em água ou leite desnatado" },
      { name: "Banana prata", quantity: 1, unit: "unidade", note: "" },
      { name: "Pasta de amendoim integral", quantity: 15, unit: "g", note: "Sem açúcar" },
    ]),
    mk("Almoço", [
      { name: "Peito de frango grelhado", quantity: 120, unit: "g", note: "Tempero mínimo" },
      { name: "Arroz integral", quantity: 80, unit: "g", note: "Cozido" },
      { name: "Brócolis no vapor", quantity: 100, unit: "g", note: "" },
      { name: "Azeite extra virgem", quantity: 10, unit: "ml", note: "Finalizar" },
    ]),
    mk("Lanche", [
      { name: "Iogurte natural", quantity: 170, unit: "g", note: "" },
      { name: "Castanha do Pará", quantity: 15, unit: "g", note: "Picada" },
    ]),
    mk("Jantar", [
      { name: "Salmão assado", quantity: 100, unit: "g", note: "Limão e ervas" },
      { name: "Batata doce", quantity: 120, unit: "g", note: "Assada" },
      { name: "Salada de folhas", quantity: 1, unit: "unidade", note: "À vontade com limão" },
    ]),
  ];
}
