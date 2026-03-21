import type { DraftPlanFoodOption, DraftPlanMeal } from "@/lib/draft-storage";

function opt(partial: Omit<DraftPlanFoodOption, "id">): DraftPlanFoodOption {
  return { ...partial, id: crypto.randomUUID() };
}

function meal(
  name: string,
  time: string,
  observation: string,
  groups: { name: string; options: Omit<DraftPlanFoodOption, "id">[] }[],
): DraftPlanMeal {
  return {
    id: crypto.randomUUID(),
    name,
    time,
    observation,
    groups: groups.map((g) => ({
      id: crypto.randomUUID(),
      name: g.name,
      options: g.options.map((o) => opt(o)),
    })),
  };
}

/** Exemplo clínico completo: grupos e opções por refeição. */
export function getExampleMeals(): DraftPlanMeal[] {
  return [
    meal("Café da manhã", "07:30", "Preferir chá sem açúcar; ajustar lactose conforme tolerância.", [
      {
        name: "Bebida",
        options: [
          opt({
            name: "Chá verde",
            quantity: 200,
            unit: "ml",
            householdMeasure: "1 xícara grande",
            grams: 0,
            ml: 200,
            note: "Sem açúcar",
            recipe: "",
            imageUrl: "",
          }),
          opt({
            name: "Café coado",
            quantity: 150,
            unit: "ml",
            householdMeasure: "1 xícara",
            grams: 0,
            ml: 150,
            note: "Opcional com leite desnatado",
            recipe: "",
            imageUrl: "",
          }),
        ],
      },
      {
        name: "Carboidrato",
        options: [
          opt({
            name: "Pão integral",
            quantity: 2,
            unit: "unidade",
            householdMeasure: "2 fatias médias",
            grams: 50,
            ml: 0,
            note: "",
            recipe: "",
            imageUrl: "",
          }),
          opt({
            name: "Aveia em flocos",
            quantity: 40,
            unit: "g",
            householdMeasure: "4 colheres de sopa",
            grams: 40,
            ml: 0,
            note: "Cozida em água ou leite desnatado",
            recipe: "Ferver água, adicionar aveia e mexer por 3 min.",
            imageUrl: "",
          }),
        ],
      },
      {
        name: "Proteína / Fruta",
        options: [
          opt({
            name: "Iogurte natural desnatado",
            quantity: 120,
            unit: "g",
            householdMeasure: "1 pote pequeno",
            grams: 120,
            ml: 0,
            note: "",
            recipe: "",
            imageUrl: "",
          }),
          opt({
            name: "Banana prata",
            quantity: 1,
            unit: "unidade",
            householdMeasure: "1 unidade média",
            grams: 100,
            ml: 0,
            note: "Pode trocar por maçã",
            recipe: "",
            imageUrl: "",
          }),
        ],
      },
    ]),
    meal("Almoço", "12:30", "Priorizar preparo com pouco óleo; salada à vontade com limão.", [
      {
        name: "Proteína",
        options: [
          opt({
            name: "Peito de frango grelhado",
            quantity: 120,
            unit: "g",
            householdMeasure: "1 filé médio",
            grams: 120,
            ml: 0,
            note: "Temperos naturais",
            recipe: "Grelhar 6–8 min cada lado com sal, pimenta e alho.",
            imageUrl: "",
          }),
          opt({
            name: "Ovo cozido",
            quantity: 2,
            unit: "unidade",
            householdMeasure: "2 unidades",
            grams: 100,
            ml: 0,
            note: "Substituição vegetariana parcial",
            recipe: "",
            imageUrl: "",
          }),
        ],
      },
      {
        name: "Carboidrato",
        options: [
          opt({
            name: "Arroz integral",
            quantity: 80,
            unit: "g",
            householdMeasure: "4 colheres de arroz cheias",
            grams: 80,
            ml: 0,
            note: "Cozido",
            recipe: "",
            imageUrl: "",
          }),
        ],
      },
      {
        name: "Salada / Vegetais",
        options: [
          opt({
            name: "Salada de folhas",
            quantity: 1,
            unit: "porção",
            householdMeasure: "1 prato sobremesa",
            grams: 0,
            ml: 0,
            note: "À vontade com limão e azeite (10 ml)",
            recipe: "",
            imageUrl: "",
          }),
          opt({
            name: "Brócolis no vapor",
            quantity: 100,
            unit: "g",
            householdMeasure: "1 concha média",
            grams: 100,
            ml: 0,
            note: "",
            recipe: "Vapor por 5 min; não cozinhar demais.",
            imageUrl: "",
          }),
        ],
      },
    ]),
    meal("Lanche", "15:30", "", [
      {
        name: "Complemento",
        options: [
          opt({
            name: "Castanha do Pará",
            quantity: 15,
            unit: "g",
            householdMeasure: "2 unidades médias picadas",
            grams: 15,
            ml: 0,
            note: "",
            recipe: "",
            imageUrl: "",
          }),
        ],
      },
      {
        name: "Laticínio / Fruta",
        options: [
          opt({
            name: "Iogurte natural",
            quantity: 170,
            unit: "g",
            householdMeasure: "1 pote",
            grams: 170,
            ml: 0,
            note: "",
            recipe: "",
            imageUrl: "",
          }),
        ],
      },
    ]),
    meal("Jantar", "19:30", "Jantar mais leve; evitar frituras.", [
      {
        name: "Proteína",
        options: [
          opt({
            name: "Salmão assado",
            quantity: 100,
            unit: "g",
            householdMeasure: "1 posta pequena",
            grams: 100,
            ml: 0,
            note: "Limão e ervas",
            recipe: "Assar a 200 °C por 15 min com limão.",
            imageUrl: "",
          }),
        ],
      },
      {
        name: "Carboidrato",
        options: [
          opt({
            name: "Batata doce",
            quantity: 120,
            unit: "g",
            householdMeasure: "1 unidade pequena",
            grams: 120,
            ml: 0,
            note: "Assada",
            recipe: "",
            imageUrl: "",
          }),
        ],
      },
    ]),
  ];
}
